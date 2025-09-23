import { randomUUID } from "crypto"
import { getDb } from "./mongo"
import { ObjectId, MongoClient } from "mongodb"
import Redis from "ioredis"
import { 
  broadcastAuctionUpdate, 
  broadcastAuctionExtension, 
  sendBidNotifications,
  AuctionUpdateData 
} from "./websocket"

// Redis connection for auction locks
let redis: Redis | null = null

async function getRedis(): Promise<Redis> {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379")
  }
  return redis
}

// Enhanced Types for Proxy Bidding System
export type EnhancedAuction = {
  id: string
  item_id: string
  created_by: string
  starting_price: number
  current_price: number
  leading_bid_id?: string
  min_increment: number
  duration_hours: number
  created_at: Date
  ends_at: Date
  extended_ends_at?: Date
  status: "active" | "completed" | "cancelled"
  total_bids: number
  soft_close_triggered: boolean
}

export type ProxyBid = {
  id: string
  auction_id: string
  vendor_id: string
  max_proxy_bid: number
  current_bid_amount: number
  original_bid_amount: number
  is_proxy_bid: boolean
  proxy_bid_parent_id?: string
  bid_status: "active" | "outbid" | "winning" | "lost"
  created_at: Date
  auto_bid_count: number
}

// Auction Lock Management
async function acquireAuctionLock(auctionId: string, timeout: number = 10000): Promise<string | null> {
  const redis = await getRedis()
  const lockKey = `auction_lock:${auctionId}`
  const lockValue = `${Date.now()}_${Math.random()}`
  
  const acquired = await redis.set(lockKey, lockValue, 'PX', timeout, 'NX')
  return acquired ? lockValue : null
}

async function releaseAuctionLock(auctionId: string, lockValue: string): Promise<boolean> {
  const redis = await getRedis()
  const lockKey = `auction_lock:${auctionId}`
  
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `
  
  const result = await redis.eval(script, 1, lockKey, lockValue)
  return result === 1
}

// Enhanced Auction Creation
export async function createEnhancedAuction(input: {
  item_id: string
  created_by: string
  starting_price: number
  duration_hours: number
  min_increment?: number
}): Promise<EnhancedAuction> {
  const db = await getDb()
  const id = randomUUID()
  const now = new Date()
  const ends_at = new Date(now.getTime() + input.duration_hours * 60 * 60 * 1000)
  
  const auction: EnhancedAuction = {
    id,
    item_id: input.item_id,
    created_by: input.created_by,
    starting_price: input.starting_price,
    current_price: input.starting_price,
    min_increment: input.min_increment || 50,
    duration_hours: input.duration_hours,
    created_at: now,
    ends_at,
    status: "active",
    total_bids: 0,
    soft_close_triggered: false
  }
  
  await db.collection("enhanced_auctions").insertOne({ 
    _id: new ObjectId(),
    auction_id: id,
    ...auction,
    created_at: auction.created_at.toISOString(),
    ends_at: auction.ends_at.toISOString()
  })
  
  return auction
}

// Get Enhanced Auction
export async function getEnhancedAuction(id: string): Promise<EnhancedAuction | null> {
  const db = await getDb()
  const auction = await db.collection("enhanced_auctions").findOne({ auction_id: id })
  if (!auction) return null
  
  const { _id, auction_id, ...rest } = auction
  return {
    id: auction_id,
    ...rest,
    created_at: new Date(rest.created_at),
    ends_at: new Date(rest.ends_at),
    extended_ends_at: rest.extended_ends_at ? new Date(rest.extended_ends_at) : undefined
  } as EnhancedAuction
}

// Bid Validation
function validateBidEligibility(auction: EnhancedAuction, vendorId: string, maxProxyBid: number): void {
  if (auction.status !== "active") {
    throw new Error("Auction is not active")
  }
  
  if (new Date() > auction.ends_at) {
    throw new Error("Auction has expired")
  }
  
  if (auction.created_by === vendorId) {
    throw new Error("Cannot bid on your own auction")
  }
  
  const minBid = auction.current_price + auction.min_increment
  if (maxProxyBid < minBid) {
    throw new Error(`Maximum bid must be at least ₹${minBid}`)
  }
}

// Calculate Optimal Bid Amount
async function calculateOptimalBid(auction: EnhancedAuction, maxProxyBid: number): Promise<number> {
  const db = await getDb()
  
  // Get all active proxy bids for this auction, excluding current bidder
  const competingBids = await db.collection("proxy_bids").find({
    auction_id: auction.id,
    bid_status: { $in: ["active", "winning"] }
  }).sort({ max_proxy_bid: -1 }).toArray()
  
  const currentPrice = auction.current_price
  const minIncrement = auction.min_increment
  
  if (competingBids.length === 0) {
    // No competition, bid minimum required
    return Math.max(auction.starting_price, currentPrice + minIncrement)
  }
  
  // Find the highest competing proxy bid
  const highestCompeting = competingBids[0]
  const secondHighest = competingBids[1]
  
  if (!secondHighest) {
    // Only one competitor
    if (maxProxyBid > highestCompeting.max_proxy_bid) {
      return Math.min(highestCompeting.max_proxy_bid + minIncrement, maxProxyBid)
    } else {
      throw new Error(`Your maximum bid must exceed ₹${highestCompeting.max_proxy_bid}`)
    }
  }
  
  // Multiple competitors - bid enough to beat the second highest
  const requiredBid = Math.min(
    secondHighest.max_proxy_bid + minIncrement,
    maxProxyBid
  )
  
  if (requiredBid <= highestCompeting.max_proxy_bid) {
    throw new Error(`Your maximum bid must exceed ₹${highestCompeting.max_proxy_bid}`)
  }
  
  return requiredBid
}

// Get MongoDB Client for Session
async function getMongoClient(): Promise<MongoClient> {
  const db = await getDb()
  // Access the client through the db.s property (internal MongoDB driver property)
  return (db as any).s.client
}

// Atomic Bid Placement with MongoDB Transaction
async function placeBidAtomic(
  auction: EnhancedAuction, 
  vendorId: string, 
  bidAmount: number, 
  maxProxyBid: number
): Promise<ProxyBid> {
  const client = await getMongoClient()
  const session = client.startSession()
  
  try {
    let newBid: ProxyBid
    
    await session.withTransaction(async () => {
      const db = await getDb()
      const bidId = randomUUID()
      
      newBid = {
        id: bidId,
        auction_id: auction.id,
        vendor_id: vendorId,
        max_proxy_bid: maxProxyBid,
        current_bid_amount: bidAmount,
        original_bid_amount: bidAmount,
        is_proxy_bid: false,
        bid_status: "winning",
        created_at: new Date(),
        auto_bid_count: 0
      }
      
      // Insert the new bid
      await db.collection("proxy_bids").insertOne({
        _id: new ObjectId(),
        bid_id: bidId,
        ...newBid,
        created_at: newBid.created_at.toISOString()
      }, { session })
      
      // Update previous leading bid status
      if (auction.leading_bid_id) {
        await db.collection("proxy_bids").updateOne(
          { bid_id: auction.leading_bid_id },
          { $set: { bid_status: "outbid" } },
          { session }
        )
      }
      
      // Update auction with new leading bid
      await db.collection("enhanced_auctions").updateOne(
        { auction_id: auction.id },
        {
          $set: {
            current_price: bidAmount,
            leading_bid_id: bidId,
            total_bids: auction.total_bids + 1
          }
        },
        { session }
      )
    })
    
    return newBid!
  } finally {
    await session.endSession()
  }
}

// Get Competing Proxy Bids
async function getCompetingProxyBids(
  auctionId: string, 
  excludeVendorId: string, 
  currentPrice: number
): Promise<ProxyBid[]> {
  const db = await getDb()
  
  const bids = await db.collection("proxy_bids").find({
    auction_id: auctionId,
    vendor_id: { $ne: excludeVendorId },
    max_proxy_bid: { $gt: currentPrice },
    bid_status: { $in: ["active", "winning", "outbid"] }
  }).sort({ max_proxy_bid: -1 }).toArray()
  
  return bids.map(bid => {
    const { _id, bid_id, created_at, ...rest } = bid
    return {
      ...rest,
      id: bid_id,
      created_at: new Date(created_at)
    } as ProxyBid
  })
}

// Place Automatic Proxy Bid
async function placeAutomaticBid(
  auctionId: string, 
  vendorId: string, 
  bidAmount: number, 
  parentBidId: string
): Promise<ProxyBid> {
  const db = await getDb()
  const bidId = randomUUID()
  
  const automaticBid: ProxyBid = {
    id: bidId,
    auction_id: auctionId,
    vendor_id: vendorId,
    max_proxy_bid: bidAmount, // For auto bids, this equals current_bid_amount
    current_bid_amount: bidAmount,
    original_bid_amount: bidAmount,
    is_proxy_bid: true,
    proxy_bid_parent_id: parentBidId,
    bid_status: "winning",
    created_at: new Date(),
    auto_bid_count: 0
  }
  
  await db.collection("proxy_bids").insertOne({
    _id: new ObjectId(),
    bid_id: bidId,
    ...automaticBid,
    created_at: automaticBid.created_at.toISOString()
  })
  
  // Increment auto bid count on parent bid
  await db.collection("proxy_bids").updateOne(
    { bid_id: parentBidId },
    { $inc: { auto_bid_count: 1 } }
  )
  
  return automaticBid
}

// Trigger Competing Proxy Bids
async function triggerCompetingProxyBids(
  auction: EnhancedAuction, 
  newLeadingBid: ProxyBid
): Promise<void> {
  const competingBids = await getCompetingProxyBids(
    auction.id,
    newLeadingBid.vendor_id,
    newLeadingBid.current_bid_amount
  )
  
  for (const proxyBid of competingBids) {
    if (proxyBid.max_proxy_bid > newLeadingBid.current_bid_amount) {
      const counterBidAmount = Math.min(
        newLeadingBid.current_bid_amount + auction.min_increment,
        proxyBid.max_proxy_bid
      )
      
      if (counterBidAmount > newLeadingBid.current_bid_amount) {
        const counterBid = await placeAutomaticBid(
          auction.id,
          proxyBid.vendor_id,
          counterBidAmount,
          proxyBid.id
        )
        
        // Update auction current price
        const db = await getDb()
        await db.collection("enhanced_auctions").updateOne(
          { auction_id: auction.id },
          {
            $set: {
              current_price: counterBidAmount,
              leading_bid_id: counterBid.id,
              total_bids: auction.total_bids + 1
            }
          }
        )
        
        // Update previous leading bid
        await db.collection("proxy_bids").updateOne(
          { bid_id: newLeadingBid.id },
          { $set: { bid_status: "outbid" } }
        )
        
        // Mark new counter bid as winning
        await db.collection("proxy_bids").updateOne(
          { bid_id: counterBid.id },
          { $set: { bid_status: "winning" } }
        )
        
        // Recursively trigger more bids
        const updatedAuction = await getEnhancedAuction(auction.id)
        if (updatedAuction) {
          await triggerCompetingProxyBids(updatedAuction, counterBid)
        }
        break // Only one counter-bid per round
      }
    }
  }
}

// Soft-Close Anti-Sniping Mechanism
async function checkSoftCloseConditions(auction: EnhancedAuction, newBid: ProxyBid): Promise<void> {
  const SOFT_CLOSE_WINDOW = 5 * 60 * 1000 // 5 minutes
  const EXTENSION_TIME = 5 * 60 * 1000     // Extend by 5 minutes
  
  const timeRemaining = auction.ends_at.getTime() - Date.now()
  
  if (timeRemaining <= SOFT_CLOSE_WINDOW && !auction.soft_close_triggered) {
    const db = await getDb()
    const newEndTime = new Date(Date.now() + EXTENSION_TIME)
    
    await db.collection("enhanced_auctions").updateOne(
      { auction_id: auction.id },
      {
        $set: {
          extended_ends_at: newEndTime.toISOString(),
          soft_close_triggered: true
        }
      }
    )
    
    // Broadcast auction extension via WebSocket
    await broadcastAuctionExtension(auction.id, newEndTime)
    console.log(`🔔 Auction ${auction.id} extended to ${newEndTime.toISOString()}`)
  }
}

// Main Proxy Bid Processing Function
export async function processProxyBid(
  auctionId: string, 
  vendorId: string, 
  maxProxyBid: number
): Promise<ProxyBid> {
  const lockValue = await acquireAuctionLock(auctionId)
  if (!lockValue) {
    throw new Error("Auction is temporarily locked, please try again")
  }
  
  try {
    // 1. Get current auction state
    const auction = await getEnhancedAuction(auctionId)
    if (!auction) {
      throw new Error("Auction not found")
    }
    
    // 2. Validate bid eligibility
    validateBidEligibility(auction, vendorId, maxProxyBid)
    
    // 3. Calculate optimal bid amount
    const bidAmount = await calculateOptimalBid(auction, maxProxyBid)
    
    // 4. Place the bid atomically
    const newBid = await placeBidAtomic(auction, vendorId, bidAmount, maxProxyBid)
    
    // 5. Trigger proxy bids from other vendors
    await triggerCompetingProxyBids(auction, newBid)
    
    // 6. Check soft-close conditions
    await checkSoftCloseConditions(auction, newBid)
    
    // 7. Broadcast updates via WebSocket
    const updateData: AuctionUpdateData = {
      type: 'BID_PLACED',
      auctionId: auction.id,
      currentPrice: newBid.current_bid_amount,
      leadingBidder: newBid.vendor_id,
      totalBids: auction.total_bids + 1,
      timeRemaining: auction.ends_at.getTime() - Date.now(),
      isProxyBid: newBid.is_proxy_bid
    }
    
    await broadcastAuctionUpdate(auction.id, updateData)
    await sendBidNotifications(auction.id, newBid)
    console.log(`🎯 New bid placed: ₹${bidAmount} by vendor ${vendorId}`)
    
    return newBid
  } finally {
    await releaseAuctionLock(auctionId, lockValue)
  }
}

// List Enhanced Auctions
export async function listEnhancedAuctions(filter?: { 
  status?: "active" | "completed" | "cancelled"
  created_by?: string
  item_id?: string
}): Promise<EnhancedAuction[]> {
  const db = await getDb()
  const query: any = {}
  
  if (filter?.status) query.status = filter.status
  if (filter?.created_by) query.created_by = filter.created_by
  if (filter?.item_id) query.item_id = filter.item_id
  
  const auctions = await db.collection("enhanced_auctions")
    .find(query)
    .sort({ created_at: -1 })
    .toArray()
  
  return auctions.map(auction => {
    const { _id, auction_id, created_at, ends_at, extended_ends_at, ...rest } = auction
    return {
      ...rest,
      id: auction_id,
      created_at: new Date(created_at),
      ends_at: new Date(ends_at),
      extended_ends_at: extended_ends_at ? new Date(extended_ends_at) : undefined
    } as EnhancedAuction
  })
}

// List Proxy Bids for Auction
export async function listProxyBids(auctionId: string): Promise<ProxyBid[]> {
  const db = await getDb()
  
  const bids = await db.collection("proxy_bids")
    .find({ auction_id: auctionId })
    .sort({ current_bid_amount: -1, created_at: 1 })
    .toArray()
  
  return bids.map(bid => {
    const { _id, bid_id, created_at, ...rest } = bid
    return {
      ...rest,
      id: bid_id,
      created_at: new Date(created_at)
    } as ProxyBid
  })
}

// Check and Complete Expired Enhanced Auctions
export async function checkExpiredEnhancedAuctions(): Promise<void> {
  const db = await getDb()
  const now = new Date()
  
  const expiredAuctions = await db.collection("enhanced_auctions").find({
    status: "active",
    $or: [
      { ends_at: { $lt: now.toISOString() } },
      { extended_ends_at: { $lt: now.toISOString() } }
    ]
  }).toArray()
  
  console.log(`🔍 Found ${expiredAuctions.length} expired enhanced auctions`)
  
  for (const auction of expiredAuctions) {
    await completeEnhancedAuction(auction.auction_id)
  }
}

// Complete Enhanced Auction
async function completeEnhancedAuction(auctionId: string): Promise<boolean> {
  const client = await getMongoClient()
  const session = client.startSession()
  
  try {
    await session.withTransaction(async () => {
      const db = await getDb()
      
      // Get winning bid
      const winningBid = await db.collection("proxy_bids").findOne(
        { auction_id: auctionId, bid_status: "winning" },
        { session }
      )
      
      if (winningBid) {
        // Mark all other bids as lost
        await db.collection("proxy_bids").updateMany(
          { 
            auction_id: auctionId, 
            bid_id: { $ne: winningBid.bid_id } 
          },
          { $set: { bid_status: "lost" } },
          { session }
        )
      }
      
      // Mark auction as completed
      await db.collection("enhanced_auctions").updateOne(
        { auction_id: auctionId },
        { $set: { status: "completed" } },
        { session }
      )
    })
    
    console.log(`✅ Enhanced auction ${auctionId} completed`)
    return true
  } finally {
    await session.endSession()
  }
}
