import { readFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { MongoClient } from "mongodb"

async function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env")
  if (!existsSync(envPath)) return
  const raw = await readFile(envPath, "utf8")
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

async function main() {
  await loadEnv()

  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB || "smart-ewaste"

  if (!uri) {
    console.error("MONGODB_URI is not set. Add it to .env and try again.")
    process.exit(1)
  }

  const client = new MongoClient(uri)
  try {
    console.log("Connecting to MongoDB...")
    await client.connect()
    const db = client.db(dbName)
    console.log(`Connected. DB="${dbName}"`)

    // Get some items from the database to create auctions for
    const items = await db.collection("items").find({}).limit(5).toArray()
    console.log(`Found ${items.length} items in database`)

    if (items.length === 0) {
      console.log("No items found. Please run the main seed script first.")
      return
    }

    // Create sample auctions
    const sampleAuctions = []
    const currentTime = new Date()
    
    for (let i = 0; i < Math.min(3, items.length); i++) {
      const item = items[i]
      const startTime = new Date(currentTime.getTime() - (i * 24 * 60 * 60 * 1000)) // Start auctions on different days
      const endTime = new Date(startTime.getTime() + (24 * 60 * 60 * 1000)) // 24 hours duration
      
      const auction = {
        _id: `auction-${i + 1}`,
        item_id: item._id,
        created_by: "admin-user-1", // Assume admin creates auctions
        starting_price: item.current_price ? Math.floor(item.current_price * 0.8) : 1000, // 80% of current price or 1000
        current_highest_bid: null,
        current_highest_bidder: null,
        status: i === 0 ? "active" : (i === 1 ? "completed" : "active"), // Mix of statuses
        duration_hours: 24,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        created_at: startTime.toISOString()
      }
      
      // Add a winning bid for completed auction
      if (auction.status === "completed") {
        auction.current_highest_bid = auction.starting_price + 500
        auction.current_highest_bidder = "vendor-1"
      }
      
      sampleAuctions.push(auction)
    }

    // Insert auctions
    let created = 0
    let skipped = 0
    
    for (const auction of sampleAuctions) {
      const exists = await db.collection("auctions").findOne({ _id: auction._id })
      if (exists) {
        console.log(`Skipping existing auction: ${auction._id}`)
        skipped++
        continue
      }
      
      await db.collection("auctions").insertOne(auction)
      console.log(`Created auction: ${auction._id} for item: ${auction.item_id}`)
      created++
    }

    console.log(`\nAuction seeding complete:`)
    console.log(`- Created: ${created} auctions`)
    console.log(`- Skipped: ${skipped} auctions`)

    // Also create some sample bids for the auctions
    const sampleBids = [
      {
        _id: "bid-1",
        auction_id: "auction-1",
        vendor_id: "vendor-1",
        amount: sampleAuctions[0].starting_price + 100,
        bid_time: new Date().toISOString(),
        status: "active"
      },
      {
        _id: "bid-2", 
        auction_id: "auction-1",
        vendor_id: "vendor-2",
        amount: sampleAuctions[0].starting_price + 200,
        bid_time: new Date().toISOString(),
        status: "winning"
      }
    ]

    let bidCreated = 0
    let bidSkipped = 0
    
    for (const bid of sampleBids) {
      const exists = await db.collection("bids").findOne({ _id: bid._id })
      if (exists) {
        bidSkipped++
        continue
      }
      
      await db.collection("bids").insertOne(bid)
      bidCreated++
    }

    console.log(`\nBid seeding complete:`)
    console.log(`- Created: ${bidCreated} bids`)
    console.log(`- Skipped: ${bidSkipped} bids`)

  } catch (err) {
    console.error("Error:", err)
    process.exitCode = 1
  } finally {
    try { await client.close() } catch {}
  }
}

main()
