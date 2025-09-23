"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppNav } from "@/components/app-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Item = {
  id: string
  name: string
  description?: string
  status: string
  category: "Tablet" | "Microwave" | "Air Conditioner" | "TV" | "Washing Machine" | "Laptop" | "Smartphone" | "Refrigerator"
  department_id: number
  reported_by: string
  reported_date: string
  disposed_date?: string | null
  qr_code_url: string
  disposition?: "Recyclable" | "Reusable" | "Hazardous" | null
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
}

export default function ItemDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [disposition, setDisposition] = useState<Item["disposition"] | null>(null)

  // Helper function to display category with better names
  const displayCategory = (category: string) => {
    return category === "TV" ? "TV / Monitor" : category
  }

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/items/${params.id}`)
    if (res.ok) {
      const data = (await res.json()) as Item
      setItem(data)
      setDisposition((data as any).disposition ?? null)
    } else {
      setItem(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function updateStatus(next: Item["status"]) {
    if (!item) return
    const res = await fetch(`/api/items/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: next }) })
    if (res.ok) {
      await load()
    } else {
      alert("Failed to update status")
    }
  }

  async function updateDisposition(next: Item["disposition"]) {
    if (!item) return
    const res = await fetch(`/api/items/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ disposition: next }) })
    if (res.ok) {
      await load()
    } else {
      alert("Failed to save disposition")
    }
  }

  return (
    <main>
      <AppNav />
      <section className="container py-8">
        {loading ? (
          <div>Loading...</div>
        ) : item ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span>{item.name}</span>
                <Badge variant="secondary">{displayCategory(item.category)}</Badge>
                <Badge>{item.status}</Badge>
              </CardTitle>
              <CardDescription>Item ID: {item.id}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {item.description ? <div className="text-sm">{item.description}</div> : null}
              
              {/* Price Information */}
              {item.current_price && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-green-800 mb-2">💰 Price Information</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {item.original_price && (
                      <div>
                        <span className="text-muted-foreground">Original Price:</span>
                        <span className="font-medium ml-2">₹{item.original_price.toLocaleString()}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Current Price:</span>
                      <span className="font-bold ml-2 text-green-700">
                        ₹{item.current_price.toLocaleString()}
                      </span>
                      {item.predicted_price && item.predicted_price !== (item.current_price || 0) && (
                        <div className="text-xs text-muted-foreground mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                          <div className="text-xs text-blue-600">
                            ML had predicted: ₹{item.predicted_price.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="text-sm text-muted-foreground">Department: {item.department_id} · Reported by: {item.reported_by} · {new Date(item.reported_date).toLocaleString()}</div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Disposition</Label>
                  <Select value={disposition ?? ""} onValueChange={(v) => setDisposition(v as any)}>
                    <SelectTrigger><SelectValue placeholder="Set disposition" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Recyclable">Recyclable</SelectItem>
                      <SelectItem value="Reusable">Reusable</SelectItem>
                      <SelectItem value="Hazardous">Hazardous</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => updateDisposition(disposition)} disabled={!disposition}>Save disposition</Button>
                </div>
                <div className="grid gap-2">
                  <Label>Quick status update</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => updateStatus("Collected")}>Confirm Collection</Button>
                    <Button variant="outline" onClick={() => updateStatus("Recycled")}>Mark Recycled</Button>
                    <Button variant="outline" onClick={() => updateStatus("Refurbished")}>Mark Refurbished</Button>
                    <Button variant="outline" onClick={() => updateStatus("Safely Disposed")}>Mark Disposed</Button>
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground break-all">
                QR URL: <a className="underline" href={item.qr_code_url} target="_blank" rel="noopener noreferrer">{item.qr_code_url}</a>
              </div>
              <div>
                <Button variant="ghost" onClick={() => router.back()}>Back</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div>Item not found</div>
        )}
      </section>
    </main>
  )
}
