"use client"

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import type { AuctionUpdateData, PersonalizedBidUpdate } from '@/lib/server/websocket'

interface UseSocketIOReturn {
  socket: Socket | null
  isConnected: boolean
  joinAuction: (auctionId: string) => void
  leaveAuction: (auctionId: string) => void
  joinVendorNotifications: (vendorId: string) => void
}

export function useSocketIO(): UseSocketIOReturn {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    const socket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000', {
      path: '/api/socketio',
      addTrailingSlash: false,
    })

    socket.on('connect', () => {
      console.log('🔌 Connected to Socket.IO server')
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from Socket.IO server')
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('🚨 Socket.IO connection error:', error)
      setIsConnected(false)
    })

    socketRef.current = socket

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const joinAuction = (auctionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_auction', auctionId)
    }
  }

  const leaveAuction = (auctionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_auction', auctionId)
    }
  }

  const joinVendorNotifications = (vendorId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_vendor', vendorId)
    }
  }

  return {
    socket: socketRef.current,
    isConnected,
    joinAuction,
    leaveAuction,
    joinVendorNotifications
  }
}

export function useAuctionUpdates(
  auctionId: string,
  onUpdate?: (data: AuctionUpdateData) => void
) {
  const { socket, joinAuction, leaveAuction } = useSocketIO()

  useEffect(() => {
    if (socket && auctionId) {
      joinAuction(auctionId)

      const handleUpdate = (data: AuctionUpdateData) => {
        console.log('📡 Received auction update:', data)
        onUpdate?.(data)
      }

      socket.on('auction_update', handleUpdate)

      return () => {
        socket.off('auction_update', handleUpdate)
        leaveAuction(auctionId)
      }
    }
  }, [socket, auctionId, onUpdate, joinAuction, leaveAuction])

  return { socket }
}

export function useVendorNotifications(
  vendorId: string,
  onNotification?: (data: PersonalizedBidUpdate) => void
) {
  const { socket, joinVendorNotifications } = useSocketIO()

  useEffect(() => {
    if (socket && vendorId) {
      joinVendorNotifications(vendorId)

      const handleNotification = (data: PersonalizedBidUpdate) => {
        console.log('🔔 Received vendor notification:', data)
        onNotification?.(data)
      }

      socket.on('personal_update', handleNotification)

      return () => {
        socket.off('personal_update', handleNotification)
      }
    }
  }, [socket, vendorId, onNotification, joinVendorNotifications])

  return { socket }
}
