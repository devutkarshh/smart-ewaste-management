"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

const DURATION_OPTIONS = [
  { value: "0.5", label: "30 minutes", hours: 0.5 },
  { value: "1", label: "1 hour", hours: 1 },
  { value: "5", label: "5 hours", hours: 5 },
  { value: "10", label: "10 hours", hours: 10 },
  { value: "24", label: "24 hours", hours: 24 },
  { value: "48", label: "48 hours", hours: 48 },
  { value: "168", label: "1 week", hours: 168 },
]

interface StartAuctionPageProps {
  params: { id: string }
}

export default function StartAuctionPage({ params }: StartAuctionPageProps) {
  const router = useRouter()
  const [startingPrice, setStartingPrice] = useState("")
  const [duration, setDuration] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!startingPrice || !duration) {
      setError("Please fill in all fields")
      return
    }

    const price = Number(startingPrice)
    if (price < 0) {
      setError("Starting price must be 0 or greater")
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch("/api/auctions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_id: params.id,
          starting_price: price,
          duration_hours: Number(duration),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create auction")
      }

      const auction = await response.json()
      router.push(`/my-auctions?created=${auction.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Start Auction</CardTitle>
            <CardDescription>
              Set up an auction for your e-waste item. Vendors will be able to bid on your item.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="starting-price">Starting Price (₹)</Label>
                <Input
                  id="starting-price"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Enter starting price (minimum bid will be this + ₹50)"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground">
                  Vendors will need to bid at least ₹{startingPrice ? Number(startingPrice) + 50 : "50"} to participate
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Auction Duration</Label>
                <Select value={duration} onValueChange={setDuration} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select auction duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating Auction..." : "Start Auction"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
