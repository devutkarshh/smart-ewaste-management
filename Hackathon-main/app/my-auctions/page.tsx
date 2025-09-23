"use client"

import { useEffect, useState } from "react"
import { PageLayout } from "@/components/page-layout"
import { PageCard } from "@/components/page-card"
import { LoadingState } from "@/components/loading-state"
import { ErrorState } from "@/components/error-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow } from "date-fns"
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

type Auction = {
  id: string
  item_id: string
  created_by: string
  starting_price: number
  current_highest_bid?: number
  current_highest_bidder?: string
  status: "active" | "completed" | "cancelled"
  duration_hours: number
  start_time: string
  end_time: string
  created_at: string
  item?: EwasteItem
}

type Bid = {
  id: string
  auction_id: string
  vendor_id: string
  amount: number
  bid_time: string
  status: "active" | "outbid" | "winning"
}

export default function MyAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [bids, setBids] = useState<{ [auctionId: string]: Bid[] }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAuctions()
  }, [])

  const fetchAuctions = async () => {
    try {
      const response = await fetch("/api/auctions")
      if (!response.ok) throw new Error("Failed to fetch auctions")
      
      const allAuctions = await response.json()
      setAuctions(allAuctions)
      
      // Fetch bids for each auction
      const bidPromises = allAuctions.map(async (auction: Auction) => {
        const bidResponse = await fetch(`/api/auctions/${auction.id}/bids`)
        if (bidResponse.ok) {
          const auctionBids = await bidResponse.json()
          return { auctionId: auction.id, bids: auctionBids }
        }
        return { auctionId: auction.id, bids: [] }
      })
      
      const bidResults = await Promise.all(bidPromises)
      const bidMap: { [auctionId: string]: Bid[] } = {}
      bidResults.forEach(({ auctionId, bids }) => {
        bidMap[auctionId] = bids
      })
      setBids(bidMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500"
      case "completed": return "bg-blue-500"
      case "cancelled": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const getTimeRemaining = (endTime: string) => {
    const now = new Date()
    const end = new Date(endTime)
    
    if (now > end) return "Expired"
    return `${formatDistanceToNow(end)} remaining`
  }

  const activeAuctions = auctions.filter(a => a.status === "active")
  const completedAuctions = auctions.filter(a => a.status === "completed")

  if (loading) {
    return (
      <PageLayout>
        <LoadingState type="page" />
      </PageLayout>
    )
  }

  return (
    <PageLayout 
      title="My Auctions" 
      description="Track your auctions and bids"
    >
      {error && (
        <ErrorState 
          type="alert"
          message={error}
          onRetry={() => fetchAuctions()}
        />
      )}

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">Active Auctions ({activeAuctions.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed Auctions ({completedAuctions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeAuctions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500 mb-4">No active auctions</p>
                  <Button onClick={() => window.location.href = "/report"}>
                    Report New Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              activeAuctions.map((auction) => (
                <Card key={auction.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {auction.item?.name || `Item ID: ${auction.item_id}`}
                        </CardTitle>
                        <CardDescription>
                          {auction.item?.description && (
                            <div className="mb-1">{auction.item.description}</div>
                          )}
                          <div className="flex flex-wrap gap-2 text-sm">
                            {auction.item?.category && (
                              <Badge variant="outline">{auction.item.category}</Badge>
                            )}
                            {auction.item?.brand && (
                              <Badge variant="outline">{auction.item.brand}</Badge>
                            )}
                            {auction.item?.condition && (
                              <Badge variant="outline">Condition: {auction.item.condition}/10</Badge>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Started {formatDistanceToNow(new Date(auction.start_time))} ago
                          </div>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(auction.status)}>
                          {auction.status}
                        </Badge>
                        <div className="text-sm text-gray-500 mt-1">
                          {getTimeRemaining(auction.end_time)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Item Details Section - Only show real user data */}
                    {auction.item && (() => {
                      const itemDetails = formatItemDetails(auction.item)
                      const reporterInfo = getReporterInfo(auction.item)
                      
                      return itemDetails.length > 0 || reporterInfo ? (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="font-semibold text-sm text-gray-700 mb-3">Item Details</h4>
                          
                          {itemDetails.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              {itemDetails.map((detail, index) => (
                                <div key={index}>
                                  <span className="font-medium text-gray-600">{detail.label}:</span>
                                  <div>{detail.value}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Reporter Information - Only if available */}
                          {reporterInfo && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <span className="font-medium text-gray-600 text-sm">Reported by:</span>
                              <div className="mt-1 text-sm">
                                {reporterInfo.name && (
                                  <div className="font-medium">{reporterInfo.name}</div>
                                )}
                                {reporterInfo.role && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    {reporterInfo.role}
                                  </Badge>
                                )}
                                <div className="text-gray-500 text-xs mt-1">{reporterInfo.email}</div>
                                {auction.item.reported_date && (
                                  <div className="text-gray-500 text-xs">
                                    Reported on {new Date(auction.item.reported_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Item Details</h4>
                          <p className="text-sm text-gray-500">Basic item information available. Detailed specifications will be provided upon contact.</p>
                        </div>
                      )
                    })()}
                    
                    {/* Auction Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-600">Starting Price</h4>
                        <p className="text-lg font-bold">₹{auction.starting_price}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-600">Current Highest Bid</h4>
                        <p className="text-lg font-bold text-green-600">
                          {auction.current_highest_bid ? `₹${auction.current_highest_bid}` : "No bids yet"}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-600">Total Bids</h4>
                        <p className="text-lg font-bold">{bids[auction.id]?.length || 0}</p>
                      </div>
                    </div>
                    
                    {bids[auction.id] && bids[auction.id].length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-sm text-gray-600 mb-2">Recent Bids</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {bids[auction.id].slice(0, 3).map((bid) => (
                            <div key={bid.id} className="flex justify-between items-center text-sm">
                              <span>Vendor {bid.vendor_id.slice(0, 8)}...</span>
                              <span className="font-semibold">₹{bid.amount}</span>
                              <Badge variant={bid.status === "winning" ? "default" : "secondary"}>
                                {bid.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedAuctions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">No completed auctions yet</p>
                </CardContent>
              </Card>
            ) : (
              completedAuctions.map((auction) => (
                <Card key={auction.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {auction.item?.name || `Item ID: ${auction.item_id}`}
                        </CardTitle>
                        <CardDescription>
                          {auction.item?.description && (
                            <div className="mb-1">{auction.item.description}</div>
                          )}
                          <div className="flex flex-wrap gap-2 text-sm">
                            {auction.item?.category && (
                              <Badge variant="outline">{auction.item.category}</Badge>
                            )}
                            {auction.item?.brand && (
                              <Badge variant="outline">{auction.item.brand}</Badge>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Completed {formatDistanceToNow(new Date(auction.end_time))} ago
                          </div>
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(auction.status)}>
                        {auction.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Item Details Section for Completed Auctions - Only show real user data */}
                    {auction.item && (() => {
                      const itemDetails = formatItemDetails(auction.item)
                      const reporterInfo = getReporterInfo(auction.item)
                      
                      return itemDetails.length > 0 || reporterInfo ? (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="font-semibold text-sm text-gray-700 mb-3">Item Details</h4>
                          
                          {itemDetails.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              {itemDetails.map((detail, index) => (
                                <div key={index}>
                                  <span className="font-medium text-gray-600">{detail.label}:</span>
                                  <div>{detail.value}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Reporter Information - Only if available */}
                          {reporterInfo && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <span className="font-medium text-gray-600 text-sm">Reported by:</span>
                              <div className="mt-1 text-sm">
                                {reporterInfo.name && (
                                  <div className="font-medium">{reporterInfo.name}</div>
                                )}
                                {reporterInfo.role && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    {reporterInfo.role}
                                  </Badge>
                                )}
                                <div className="text-gray-500 text-xs mt-1">{reporterInfo.email}</div>
                                {auction.item.reported_date && (
                                  <div className="text-gray-500 text-xs">
                                    Reported on {new Date(auction.item.reported_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Item Details</h4>
                          <p className="text-sm text-gray-500">Basic item information available. Detailed specifications will be provided upon contact.</p>
                        </div>
                      )
                    })()}
                    
                    {/* Auction Results */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-600">Starting Price</h4>
                        <p className="text-lg">₹{auction.starting_price}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-600">Winning Bid</h4>
                        <p className="text-lg font-bold text-green-600">
                          {auction.current_highest_bid ? `₹${auction.current_highest_bid}` : "No bids"}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-600">Total Bids</h4>
                        <p className="text-lg">{bids[auction.id]?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
    </PageLayout>
  )
}
