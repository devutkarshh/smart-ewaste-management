import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { NextApiRequest, NextApiResponse } from 'next'

export type SocketIOResponse = NextApiResponse & {
  socket: {
    server: HTTPServer & {
      io?: SocketIOServer
    }
  }
}

// Auction Update Types
export interface AuctionUpdateData {
  type: 'BID_PLACED' | 'AUCTION_EXTENDED' | 'AUCTION_COMPLETED'
  auctionId: string
  currentPrice?: number
  leadingBidder?: string
  totalBids?: number
  timeRemaining?: number
  isProxyBid?: boolean
  newEndTime?: string
}

export interface PersonalizedBidUpdate {
  type: 'BID_OUTBID' | 'BID_WINNING' | 'PROXY_BID_TRIGGERED'
  auctionId: string
  bidId: string
  message: string
  currentPrice: number
}

let io: SocketIOServer | null = null

export function initializeSocketIO(server: HTTPServer): SocketIOServer {
  if (!io) {
    io = new SocketIOServer(server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? false 
          : ["http://localhost:3000", "http://127.0.0.1:3000"],
        methods: ["GET", "POST"]
      }
    })

    io.on('connection', (socket: Socket) => {
      console.log('🔌 Client connected:', socket.id)

      // Join auction room
      socket.on('join_auction', (auctionId: string) => {
        socket.join(`auction_${auctionId}`)
        console.log(`👥 Client ${socket.id} joined auction ${auctionId}`)
      })

      // Leave auction room
      socket.on('leave_auction', (auctionId: string) => {
        socket.leave(`auction_${auctionId}`)
        console.log(`👋 Client ${socket.id} left auction ${auctionId}`)
      })

      // Join personal notifications room
      socket.on('join_vendor', (vendorId: string) => {
        socket.join(`vendor_${vendorId}`)
        console.log(`🔔 Vendor ${vendorId} joined personal notifications`)
      })

      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id)
      })
    })
  }

  return io
}

export function getSocketIO(): SocketIOServer | null {
  return io
}

// Broadcast auction update to all users watching the auction
export async function broadcastAuctionUpdate(
  auctionId: string, 
  updateData: AuctionUpdateData
): Promise<void> {
  if (!io) {
    console.warn('⚠️ Socket.IO not initialized, skipping broadcast')
    return
  }

  io.to(`auction_${auctionId}`).emit('auction_update', updateData)
  console.log(`📡 Broadcasted auction update for ${auctionId}:`, updateData.type)
}

// Send personalized updates to specific vendors
export async function sendPersonalizedBidUpdate(
  vendorId: string,
  update: PersonalizedBidUpdate
): Promise<void> {
  if (!io) {
    console.warn('⚠️ Socket.IO not initialized, skipping personal update')
    return
  }

  io.to(`vendor_${vendorId}`).emit('personal_update', update)
  console.log(`🎯 Sent personal update to vendor ${vendorId}:`, update.type)
}

// Broadcast auction extension
export async function broadcastAuctionExtension(
  auctionId: string, 
  newEndTime: Date
): Promise<void> {
  const updateData: AuctionUpdateData = {
    type: 'AUCTION_EXTENDED',
    auctionId,
    newEndTime: newEndTime.toISOString()
  }

  await broadcastAuctionUpdate(auctionId, updateData)
}

// Broadcast auction completion
export async function broadcastAuctionCompletion(
  auctionId: string,
  winningBidder?: string,
  finalPrice?: number
): Promise<void> {
  const updateData: AuctionUpdateData = {
    type: 'AUCTION_COMPLETED',
    auctionId,
    leadingBidder: winningBidder,
    currentPrice: finalPrice
  }

  await broadcastAuctionUpdate(auctionId, updateData)
}

// Send bid notifications to affected vendors
export async function sendBidNotifications(
  auctionId: string,
  newBid: any,
  outbidVendors: string[] = []
): Promise<void> {
  // Notify outbid vendors
  for (const vendorId of outbidVendors) {
    await sendPersonalizedBidUpdate(vendorId, {
      type: 'BID_OUTBID',
      auctionId,
      bidId: newBid.id,
      message: `You've been outbid on auction ${auctionId}`,
      currentPrice: newBid.current_bid_amount
    })
  }

  // Notify winning bidder
  await sendPersonalizedBidUpdate(newBid.vendor_id, {
    type: 'BID_WINNING',
    auctionId,
    bidId: newBid.id,
    message: `Your bid is currently winning on auction ${auctionId}`,
    currentPrice: newBid.current_bid_amount
  })
}

export default function handler(req: NextApiRequest, res: SocketIOResponse) {
  if (!res.socket.server.io) {
    console.log('🚀 Initializing Socket.IO server...')
    res.socket.server.io = initializeSocketIO(res.socket.server)
  }
  res.end()
}
