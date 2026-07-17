"use client"

import { useEffect, useRef, useState } from "react"
import { AppNav } from "@/components/app-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// Import with error handling for browser environment
import { BrowserQRCodeReader } from "@zxing/browser"

type Item = {
  id: string
  name: string
  status: string
  category: string
  disposition?: "Recyclable" | "Reusable" | "Hazardous" | null
}

export default function VendorScanPage() {
  const [cameraReady, setCameraReady] = useState(false)
  const [result, setResult] = useState<string>("")
  const [item, setItem] = useState<Item | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const codeReaderRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Helper function to display category with better names
  const displayCategory = (category: string) => {
    return category === "TV" ? "TV / Monitor" : category
  }

  useEffect(() => {
    // Initialize QR code reader only on client side
    if (typeof window !== 'undefined') {
      try {
        codeReaderRef.current = new BrowserQRCodeReader()
      } catch (error) {
        console.error('Failed to initialize QR code reader:', error)
      }
    }

    return () => {
      stopCamera()
      codeReaderRef.current = null
    }
  }, [])

  function stopCamera() {
    const v = videoRef.current
    const s = streamRef.current || ((v?.srcObject as MediaStream | null) ?? null)
    if (s) {
      s.getTracks().forEach((t) => t.stop())
    }
    if (v) v.srcObject = null
    streamRef.current = null
    try { codeReaderRef.current?.stopContinuousDecode?.() } catch {}
  }

  async function startScan() {
    setItem(null)
    setResult("")
    setCameraReady(true)
    try {
      // Ask for camera permission up front
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } })
      streamRef.current = stream
      const v = videoRef.current
      if (v) v.srcObject = stream

      // Ensure reader exists
      if (!codeReaderRef.current) {
        try {
          codeReaderRef.current = new BrowserQRCodeReader()
        } catch (error) {
          throw new Error("QR Code reader not available")
        }
      }
    } catch (e: any) {
      if (e?.name === "NotAllowedError") {
        alert("Camera permission denied. Please allow camera access to scan QR codes.")
      } else {
        alert(e?.message || "Failed to access camera")
      }
      setCameraReady(false)
    }
  }

  async function scanQRCode() {
    if (!cameraReady || !videoRef.current || !codeReaderRef.current) return

    const reader = codeReaderRef.current
    const video = videoRef.current

    try {
      await new Promise<void>((resolve, reject) => {
        const onResult = async (res: any, err: any, controls?: { stop: () => void }) => {
          if (res) {
            try {
              let text = ''
              if (typeof res.getText === "function") text = res.getText()
              else if (typeof res.text === "string") text = res.text
              else if (typeof res === "string") text = res
              else text = JSON.stringify(res)

              setResult(text)
              await handleDecoded(text)
              resolve()
            } catch (innerErr) {
              reject(innerErr)
            } finally {
              try { controls?.stop?.() } catch {}
              try { reader.stopContinuousDecode?.() } catch {}
            }
          } else if (err && err.name && err.name !== "NotFoundException") {
            try { controls?.stop?.() } catch {}
            try { reader.stopContinuousDecode?.() } catch {}
            reject(err)
          }
        }

        if (typeof reader.decodeFromVideoElement === 'function') {
          reader.decodeFromVideoElement(video, onResult)
        } else if (typeof reader.decodeFromVideoDevice === 'function') {
          reader.decodeFromVideoDevice(undefined, video, onResult)
        } else {
          reject(new Error("QR code reader not fully initialized"))
        }
      })
    } catch (e: any) {
      if (e?.name !== "NotFoundException") {
        console.error("QR Scan error:", e)
        alert(e?.message || "Failed to scan QR code")
      }
    }
  }
  
  function toggleCamera() {
    const newMode = facingMode === "environment" ? "user" : "environment"
    setFacingMode(newMode)
    
    // Restart camera with new facing mode
    if (cameraReady) {
      stopCamera()
      setTimeout(() => startScan(), 300)
    }
  }

  async function handleDecoded(text: string) {
    // Expect URL like https://host/item/{id}
    try {
      const url = new URL(text)
      const parts = url.pathname.split("/")
      const id = parts[parts.length - 1]
      const res = await fetch(`/api/items/${id}`)
      if (res.ok) {
        const data = await res.json()
        setItem(data)
      } else {
        setItem(null)
        alert("Item not found")
      }
    } catch {
      // Maybe direct ID
      const id = text.trim()
      const res = await fetch(`/api/items/${id}`)
      if (res.ok) setItem(await res.json())
    }
  }

  async function confirmCollection() {
    if (!item) return
    const res = await fetch(`/api/items/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "Collected" }) })
    if (res.ok) {
      const updated = await res.json()
      setItem(updated)
    } else {
      alert("Failed to update status")
    }
  }

  async function markSafelyDisposed() {
    if (!item) return
    const res = await fetch(`/api/items/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "Safely Disposed" }) })
    if (res.ok) {
      const updated = await res.json()
      setItem(updated)
    } else {
      alert("Failed to update status")
    }
  }

  const [scheduled, setScheduled] = useState<Array<{ 
    id: string; 
    scheduled_date: string; 
    status: string; 
    vendor_response?: string | null; 
    vendor_response_note?: string | null; 
    contact_emails: string[]; 
    items: Array<{ 
      id: string; 
      name: string; 
      category: string; 
      current_price?: number; 
      original_price?: number; 
      brand?: string; 
      condition?: number; 
      build_quality?: number; 
      usage_pattern?: string; 
      used_duration?: number; 
      user_lifespan?: number; 
      reported_by: string; 
      reporter_email: string; 
      price_source?: "ml" | "user";
      predicted_price?: number;
    }> 
  }>>([])

  // Check if there are any pending pickups (status = "Scheduled" without vendor response)
  const hasPendingPickups = scheduled.some(p => p.status === "Scheduled" && !p.vendor_response)

  useEffect(() => {
    // Load scheduled pickups for this vendor
    fetch("/api/vendor/pickups").then(async (r) => {
      const data = await r.json()
      // Sort by scheduled_date in descending order (latest first)
      const sortedData = data.sort((a: any, b: any) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
      setScheduled(sortedData)
    }).catch(() => setScheduled([]))
  }, [])

  async function respondToPickup(pickupId: string, response: "Accepted" | "Rejected", note?: string) {
    try {
      const res = await fetch("/api/vendor/pickup-response", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pickup_id: pickupId,
          response: response,
          note: note
        })
      })
      
      if (res.ok) {
        // Show success message
        alert(`Pickup ${response.toLowerCase()} successfully!${response === "Rejected" ? " Items are now available for rescheduling." : ""}`)
        
        // Reload scheduled pickups
        const updatedRes = await fetch("/api/vendor/pickups")
        if (updatedRes.ok) {
          const data = await updatedRes.json()
          // Sort by scheduled_date in descending order (latest first)
          const sortedData = data.sort((a: any, b: any) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
          setScheduled(sortedData)
        }
      } else {
        alert("Failed to update response")
      }
    } catch (error) {
      console.error("Error responding to pickup:", error)
      alert("Failed to update response")
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#9ac37e]/5 to-transparent">
      <AppNav />
      <section className="container mx-auto py-4 sm:py-8 grid gap-4 sm:gap-6 px-4 max-w-4xl">
        <Tabs defaultValue="scan">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
            <TabsTrigger value="scan">Scan</TabsTrigger>
            <TabsTrigger value="scheduled" className="relative">
              Scheduled
              {hasPendingPickups && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              )}
            </TabsTrigger>
            <TabsTrigger value="auctions">Auctions</TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="grid gap-6">
            <Card className="border-[#9ac37e]/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#3e5f44] text-lg sm:text-xl">Vendor QR Scan</CardTitle>
                <CardDescription className="text-[#3e5f44]/70">Use device camera to scan item QR and update status.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="manual" className="text-sm font-medium">Manual item ID or QR URL (fallback)</Label>
                    <Input id="manual" placeholder="Paste QR URL or Item ID" onChange={(e) => setResult(e.target.value)} value={result} className="w-full" />
                  </div>
                  <Button onClick={() => handleDecoded(result)} disabled={!result} className="w-full">Lookup</Button>
                </div>
                <div className="grid gap-3">
                  <div className="relative rounded border overflow-hidden bg-black/80 aspect-video w-full max-w-md mx-auto">
                    <video ref={videoRef} className="w-full h-full object-cover" muted autoPlay playsInline />
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                    {!cameraReady ? (
                      <>
                        <Button onClick={startScan} className="flex-1 sm:flex-none">Start Camera</Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={scanQRCode} className="flex-1 sm:flex-none">Scan QR</Button>
                        <Button variant="outline" onClick={toggleCamera} className="flex-1 sm:flex-none text-xs sm:text-sm">
                          Switch ({facingMode === "environment" ? "Back" : "Front"})
                        </Button>
                        <Button variant="outline" onClick={stopCamera} className="flex-1 sm:flex-none">Stop</Button>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Note: Allow camera access when prompted. Use the Scan QR button to capture the current frame.</div>
                </div>
                {item ? (
                  <div className="rounded border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.id}</div>
                      </div>
                      <Badge>{item.status}</Badge>
                    </div>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <Button onClick={confirmCollection} disabled={item.status === "Collected"} className="flex-1 sm:flex-none">Confirm Collection</Button>
                      {item.disposition === "Hazardous" && item.status !== "Safely Disposed" ? (
                        <Button variant="destructive" onClick={markSafelyDisposed} className="flex-1 sm:flex-none">Mark Safely Disposed</Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled" className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled pickups</CardTitle>
                <CardDescription>Upcoming pickups assigned to your company. Review item details and respond to pickup requests.</CardDescription>
              </CardHeader>
              <CardContent>
                {scheduled.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No scheduled pickups.</div>
                ) : (
                  <div className="grid gap-4">
                    {scheduled.map((p) => (
                      <div key={p.id} className="rounded border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-muted-foreground">{new Date(p.scheduled_date).toLocaleDateString()}</div>
                            <div className="font-medium">Pickup #{p.id.slice(0, 8)}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={p.status === "Vendor_Accepted" ? "default" : p.status === "Vendor_Rejected" ? "destructive" : "secondary"}>
                              {p.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>

                        {/* Item Details */}
                        {p.items?.length ? (
                          <div className="space-y-3">
                            <div className="text-sm font-medium">Items for pickup:</div>
                            {p.items.map((item) => (
                              <div key={item.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium">{item.name}</div>
                                  <Badge variant="outline">{displayCategory(item.category)}</Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {item.brand && (
                                    <div>
                                      <span className="text-muted-foreground">Brand:</span> {item.brand}
                                    </div>
                                  )}
                                  {item.condition && (
                                    <div>
                                      <span className="text-muted-foreground">Condition:</span> {item.condition}/5
                                    </div>
                                  )}
                                  {item.build_quality && (
                                    <div>
                                      <span className="text-muted-foreground">Build Quality:</span> {item.build_quality}/5
                                    </div>
                                  )}
                                  {item.usage_pattern && (
                                    <div>
                                      <span className="text-muted-foreground">Usage:</span> {item.usage_pattern}
                                    </div>
                                  )}
                                  {item.used_duration && (
                                    <div>
                                      <span className="text-muted-foreground">Usage Duration:</span> {item.used_duration} years
                                    </div>
                                  )}
                                  {item.user_lifespan && (
                                    <div>
                                      <span className="text-muted-foreground">Expected Lifespan:</span> {item.user_lifespan} years
                                    </div>
                                  )}
                                </div>

                                {/* Reporter Contact for this specific item */}
                                {item.reporter_email && item.reporter_email !== "Unknown" ? (
                                  <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mt-2">
                                    <div className="text-xs font-medium text-blue-700 mb-1">📧 Item Reporter</div>
                                    <div className="text-sm">
                                      <a href={`mailto:${item.reporter_email}`} className="font-medium text-blue-700 hover:underline">
                                        {item.reporter_email}
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-gray-50 border border-gray-200 rounded-md p-2 mt-2">
                                    <div className="text-xs font-medium text-gray-600 mb-1">📧 Item Reporter</div>
                                    <div className="text-sm text-muted-foreground">
                                      Contact information not available
                                    </div>
                                  </div>
                                )}

                                {/* Highlighted Price Information */}
                                <div className="bg-primary/10 border border-primary/20 rounded-md p-3 mt-3">
                                  <div className="text-sm font-medium text-primary mb-1">💰 Price Information</div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    {item.original_price && (
                                      <div>
                                        <span className="text-muted-foreground">Cost Price:</span> 
                                        <span className="font-medium ml-1">₹{item.original_price.toLocaleString()}</span>
                                      </div>
                                    )}
                                    {item.current_price && (
                                      <div>
                                        <span className="text-muted-foreground">Price:</span> 
                                        <span className="font-bold text-primary ml-1 text-base">₹{item.current_price.toLocaleString()}</span>
                                        {item.price_source && (
                                          <div className="text-xs text-muted-foreground mt-1">
                                            {item.price_source === "ml" ? "🤖 ML Selected by Reporter" : "👤 Set by Reporter"}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Contact Information for this item */}
                                {p.contact_emails && p.contact_emails.length > 0 && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
                                    <div className="text-sm font-medium text-blue-700 mb-1">📧 Reporter Contact{p.contact_emails.length > 1 ? 's' : ''}</div>
                                    <div className="text-sm space-y-1">
                                      {p.contact_emails.map((email: string, idx: number) => (
                                        <div key={idx}>
                                          <a href={`mailto:${email}`} className="font-medium text-blue-700 hover:underline">
                                            {email}
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {/* Vendor Response Section */}
                        {p.vendor_response ? (
                          <div className={`rounded-lg p-3 ${p.vendor_response === "Accepted" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`text-sm font-medium ${p.vendor_response === "Accepted" ? "text-green-700" : "text-red-700"}`}>
                                Response: {p.vendor_response}
                              </div>
                            </div>
                            {p.vendor_response_note && (
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Note:</span> {p.vendor_response_note}
                              </div>
                            )}
                          </div>
                        ) : (
                          p.status === "Scheduled" && (
                            <div className="flex gap-2 pt-2">
                              <Button 
                                size="sm" 
                                onClick={() => respondToPickup(p.id, "Accepted")}
                                className="flex-1"
                              >
                                Accept Pickup
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  const note = prompt("Optional note for rejection:")
                                  if (confirm("Rejecting this pickup will make the items available for rescheduling. Are you sure?")) {
                                    respondToPickup(p.id, "Rejected", note || undefined)
                                  }
                                }}
                                className="flex-1"
                              >
                                Reject Pickup
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auctions" className="grid gap-6">
            <Card className="border-[#9ac37e]/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#3e5f44] text-lg sm:text-xl">Vendor Auctions</CardTitle>
                <CardDescription className="text-[#3e5f44]/70">
                  View and participate in item auctions. Bid on items to get the best deals.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="text-center py-8">
                  <div className="text-lg font-semibold mb-4 text-[#3e5f44]">🏆 Ready to Bid?</div>
                  <p className="text-[#3e5f44]/70 mb-6">
                    Access the full auction platform to view active auctions, place bids, and track your bidding history.
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/vendor/auctions'}
                    className="bg-[#3e5f44] hover:bg-[#4a6e50] text-white px-8 py-3"
                    size="lg"
                  >
                    Go to Auctions →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  )
}
