"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { PageLayout } from "@/components/page-layout"
import { PageCard } from "@/components/page-card"
import { useAuctionUpdates, useVendorNotifications } from "@/hooks/use-socket"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Clock, DollarSign, Gavel, Timer, Zap } from "lucide-react"
import { formatItemDetails, getReporterInfo } from "@/lib/utils/item-data-utils"

type EwasteItem = {
  id: string
  name: string
  description?: string
  category: string
  status: string
  department_id: number
  reported_by: string
  reported_date: string
  disposed_date?: string | null
  disposition: string | null
  qr_code_url: string
  brand?: string
  build_quality?: number
  user_lifespan?: number
  usage_pattern?: "Light" | "Moderate" | "Heavy"
  expiry_years?: number
  condition?: number
  original_price?: number
  used_duration?: number
  current_price?: number
  predicted_price?: number
  price_confirmed?: boolean
  reporter_name?: string
  reporter_email?: string
  reporter_role?: string
}

interface EnhancedAuction {
  id: string
  item_id: string
  created_by: string
  starting_price: number
  current_price: number
  leading_bid_id?: string
  min_increment: number
  duration_hours: number
  created_at: string
  ends_at: string
  extended_ends_at?: string
  status: "active" | "completed" | "cancelled"
  total_bids: number
  soft_close_triggered: boolean
  item?: EwasteItem
}

interface ProxyBid {
  id: string
  auction_id: string
  vendor_id: string
  max_proxy_bid: number
  current_bid_amount: number
  original_bid_amount: number
  is_proxy_bid: boolean
  proxy_bid_parent_id?: string
  bid_status: "active" | "outbid" | "winning" | "lost"
  created_at: string
  auto_bid_count: number
}

interface AuctionWithBids extends EnhancedAuction {
  bids: ProxyBid[]
  userBid?: ProxyBid
}

export default function EnhancedAuctionsPage() {
  const [auctions, setAuctions] = useState<AuctionWithBids[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAuction, setSelectedAuction] = useState<string | null>(null)
  const [bidAmount, setBidAmount] = useState("")
  const [bidding, setBidding] = useState(false)
  const { toast } = useToast()

  // Mock vendor ID - in real app, get from session
  const vendorId = "vendor123"

  useEffect(() => {
    fetchAuctions()
  }, [])

  // WebSocket hooks for real-time updates
  useAuctionUpdates(selectedAuction || "", (data) => {
    if (data.type === 'BID_PLACED') {
      toast({
        title: "New Bid Placed",
        description: `Current price: ₹${data.currentPrice}`,
      })
      fetchAuctions() // Refresh auction data
    } else if (data.type === 'AUCTION_EXTENDED') {
      toast({
        title: "Auction Extended",
        description: `End time extended due to late bidding`,
      })
      fetchAuctions()
    }
  })

  useVendorNotifications(vendorId, (notification) => {
    if (notification.type === 'BID_OUTBID') {
      toast({
        title: "You've been outbid!",
        description: notification.message,
        variant: "destructive"
      })
    } else if (notification.type === 'BID_WINNING') {
      toast({
        title: "You're winning!",
        description: notification.message,
      })
    }
    fetchAuctions()
  })

  const fetchAuctions = async () => {
    try {
      const response = await fetch("/api/enhanced-auctions")
      if (!response.ok) throw new Error("Failed to fetch auctions")
      
      const auctionsData: EnhancedAuction[] = await response.json()
      
      // Fetch bids for each auction
      const auctionsWithBids: AuctionWithBids[] = await Promise.all(
        auctionsData.map(async (auction) => {
          const bidsResponse = await fetch(`/api/enhanced-auctions/${auction.id}/proxy-bids`)
          const bids: ProxyBid[] = bidsResponse.ok ? await bidsResponse.json() : []
          
          const userBid = bids.find(bid => bid.vendor_id === vendorId)
          
          return {
            ...auction,
            bids,
            userBid
          }
        })
      )
      
      setAuctions(auctionsWithBids)
    } catch (error) {
      console.error("Error fetching auctions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch auctions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const placeBid = async (auctionId: string) => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      toast({
        title: "Invalid bid",
        description: "Please enter a valid bid amount",
        variant: "destructive"
      })
      return
    }

    setBidding(true)
    try {
      const response = await fetch(`/api/enhanced-auctions/${auctionId}/proxy-bids`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          max_proxy_bid: parseFloat(bidAmount)
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to place bid")
      }

      const bid = await response.json()
      toast({
        title: "Bid placed successfully!",
        description: `Your maximum bid: ₹${bid.max_proxy_bid}`,
      })
      
      setBidAmount("")
      setSelectedAuction(null)
      fetchAuctions()
    } catch (error) {
      console.error("Error placing bid:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place bid",
        variant: "destructive"
      })
    } finally {
      setBidding(false)
    }
  }

  const getTimeRemaining = (endTime: string, extendedEndTime?: string) => {
    const end = new Date(extendedEndTime || endTime)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return "Expired"
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m`
  }

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case "winning": return "bg-green-100 text-green-800"
      case "outbid": return "bg-red-100 text-red-800"
      case "active": return "bg-blue-100 text-blue-800"
      case "lost": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <PageLayout title="Enhanced Auctions" description="Real-time proxy bidding system">
        <PageCard>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </PageCard>
      </PageLayout>
    )
  }

  const activeAuctions = auctions.filter(a => a.status === "active")
  const completedAuctions = auctions.filter(a => a.status === "completed")

  return (
    <PageLayout title="Enhanced Auctions" description="Real-time proxy bidding system with anti-sniping protection">
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Auctions ({activeAuctions.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedAuctions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {activeAuctions.length === 0 ? (
            <PageCard>
              <div className="text-center py-8">
                <Gavel className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No active auctions</h3>
                <p className="mt-1 text-gray-500">Check back later for new auctions.</p>
              </div>
            </PageCard>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeAuctions.map((auction) => (
                <Card key={auction.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Auction #{auction.id.slice(-6)}</CardTitle>
                      <Badge variant={auction.soft_close_triggered ? "destructive" : "default"}>
                        {auction.soft_close_triggered ? "Extended" : "Active"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Item: {auction.item_id}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Price Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">Starting Price</Label>
                        <p className="text-lg font-semibold">₹{auction.starting_price}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Current Price</Label>
                        <p className="text-lg font-semibold text-green-600">₹{auction.current_price}</p>
                      </div>
                    </div>

                    {/* Time and Bids */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Timer className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{getTimeRemaining(auction.ends_at, auction.extended_ends_at)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Gavel className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{auction.total_bids} bids</span>
                      </div>
                    </div>

                    {/* User's Bid Status */}
                    {auction.userBid && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Your bid: ₹{auction.userBid.max_proxy_bid} - 
                          <Badge className={`ml-2 ${getBidStatusColor(auction.userBid.bid_status)}`}>
                            {auction.userBid.bid_status}
                          </Badge>
                          {auction.userBid.auto_bid_count > 0 && (
                            <span className="text-sm text-gray-500 ml-2">
                              ({auction.userBid.auto_bid_count} auto-bids)
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Bidding Form */}
                    <div className="space-y-3">
                      <Label htmlFor={`bid-${auction.id}`}>Maximum Proxy Bid</Label>
                      <div className="flex space-x-2">
                        <Input
                          id={`bid-${auction.id}`}
                          type="number"
                          placeholder={`Min: ₹${auction.current_price + auction.min_increment}`}
                          value={selectedAuction === auction.id ? bidAmount : ""}
                          onChange={(e) => {
                            setSelectedAuction(auction.id)
                            setBidAmount(e.target.value)
                          }}
                          min={auction.current_price + auction.min_increment}
                        />
                        <Button
                          onClick={() => placeBid(auction.id)}
                          disabled={bidding || !bidAmount || selectedAuction !== auction.id}
                          className="min-w-[80px]"
                        >
                          {bidding ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-1" />
                              Bid
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        System will bid automatically up to your maximum amount
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          {completedAuctions.length === 0 ? (
            <PageCard>
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No completed auctions</h3>
                <p className="mt-1 text-gray-500">Completed auctions will appear here.</p>
              </div>
            </PageCard>
          ) : (
            <div className="space-y-4">
              {completedAuctions.map((auction) => (
                <Card key={auction.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Auction #{auction.id.slice(-6)}</h3>
                        <p className="text-sm text-gray-500">Item: {auction.item_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">₹{auction.current_price}</p>
                        <Badge variant="secondary">Completed</Badge>
                      </div>
                    </div>
                    
                    {auction.userBid && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">
                          Your bid: ₹{auction.userBid.max_proxy_bid} - 
                          <Badge className={`ml-2 ${getBidStatusColor(auction.userBid.bid_status)}`}>
                            {auction.userBid.bid_status}
                          </Badge>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
