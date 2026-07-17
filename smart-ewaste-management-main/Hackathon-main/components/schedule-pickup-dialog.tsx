"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, Calendar as CalendarFull } from "lucide-react"
import { cn } from "@/lib/utils"

type Item = { id: string; name: string }
type Vendor = { id: string; company_name: string; contact_person: string; email: string; cpcb_registration_no: string }

type WinnerInfo = {
  finalPrice: number;
  winnerId: string;
  auctionId: string;
}

export function SchedulePickupDialog({
  items,
  selectedIds,
  vendors,
  onScheduled,
}: {
  items: Item[]
  selectedIds: string[]
  vendors: Vendor[]
  onScheduled: () => Promise<void> | void
}) {
  const [open, setOpen] = useState(false)
  const [vendorId, setVendorId] = useState<string>("")
  const [date, setDate] = useState<Date>()
  const [adminId, setAdminId] = useState<string>("")

  // Get current date and calculate year range dynamically
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) // Today at 00:00:00
  const maxDate = new Date(currentYear + 2, 11, 31) // End of year + 2 years

  useEffect(() => {
    fetch("/api/auth/session").then(async (r) => {
      const s = await r.json()
      setAdminId(s?.user?.user_id || "")
    })
  }, [])

  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!vendorId || !date || selectedIds.length === 0) return
    setSubmitting(true)
    const res = await fetch("/api/pickups", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        vendor_id: vendorId,
        admin_id: adminId || "unknown-admin",
        scheduled_date: format(date, "yyyy-MM-dd"),
        item_ids: selectedIds,
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      setOpen(false)
      await onScheduled()
    } else {
      alert("Failed to schedule pickup")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={selectedIds.length === 0}>Schedule pickup</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule pickup</DialogTitle>
          <DialogDescription>Select vendor and date for {selectedIds.length} item(s).</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Vendor</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger><SelectValue placeholder="Select a vendor" /></SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.contact_person} ({v.company_name})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < today}
                  showOutsideDays={false}
                  captionLayout="dropdown"
                  fromDate={today}
                  toDate={maxDate}
                  fromYear={currentYear}
                  toYear={currentYear + 2}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!vendorId || !date || submitting}>
            {submitting ? "Scheduling..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ScheduleWinnerPickupDialog({
  item,
  winnerInfo,
  onPickupScheduled,
}: {
  item: Item
  winnerInfo: WinnerInfo
  onPickupScheduled: () => Promise<void> | void
}) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date>()
  const [adminId, setAdminId] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [winnerDetails, setWinnerDetails] = useState<Vendor | null>(null)
  const [loadingVendor, setLoadingVendor] = useState(false)
  const [vendorError, setVendorError] = useState<string | null>(null)

  // Get current date and calculate year range dynamically
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) // Today at 00:00:00
  const maxDate = new Date(currentYear + 2, 11, 31) // End of year + 2 years

  useEffect(() => {
    fetch("/api/auth/session").then(async (r) => {
      const s = await r.json()
      setAdminId(s?.user?.user_id || "")
    })
  }, [])

  // Fetch winner details when dialog opens
  useEffect(() => {
    if (open && winnerInfo.winnerId) {
      setLoadingVendor(true)
      setVendorError(null)
      console.log('Fetching vendor details for ID:', winnerInfo.winnerId)
      
      fetch(`/api/vendors/${winnerInfo.winnerId}`)
        .then(r => {
          console.log('Vendor API response status:', r.status)
          if (!r.ok) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`)
          }
          return r.json()
        })
        .then(vendor => {
          console.log('Vendor details fetched successfully:', vendor)
          setWinnerDetails(vendor)
          setVendorError(null)
        })
        .catch(error => {
          console.error('Error fetching vendor details:', error)
          setVendorError(error.message)
          setWinnerDetails(null)
        })
        .finally(() => {
          setLoadingVendor(false)
        })
    }
  }, [open, winnerInfo.winnerId])

  async function submit() {
    if (!date || !winnerInfo.winnerId) return
    setSubmitting(true)
    
    const res = await fetch("/api/pickups", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        vendor_id: winnerInfo.winnerId,
        admin_id: adminId || "unknown-admin",
        scheduled_date: format(date, "yyyy-MM-dd"),
        item_ids: [item.id],
        auction_id: winnerInfo.auctionId,
        final_price: winnerInfo.finalPrice,
      }),
    })
    
    setSubmitting(false)
    if (res.ok) {
      setOpen(false)
      await onPickupScheduled()
    } else {
      alert("Failed to schedule pickup for auction winner")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-[8px] px-2 py-1 h-5 border-yellow-600 text-yellow-600 hover:bg-yellow-50"
        >
          <CalendarFull className="h-2 w-2 mr-1" />
          Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Winner Pickup</DialogTitle>
          <DialogDescription>
            Schedule pickup for auction winner of "{item.name}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4">
          {/* Auction Summary */}
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-sm font-medium text-yellow-800 mb-2">Auction Results</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Final Price:</span>
                <span className="font-bold text-yellow-700">₹{winnerInfo.finalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Winner ID:</span>
                <span className="font-mono">{String(winnerInfo.winnerId).slice(0, 12)}...</span>
              </div>
            </div>
          </div>

          {/* Winner Details */}
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="text-sm font-medium text-gray-800 mb-2">Winner Details</div>
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-1 gap-1">
                <div>
                  <span className="text-gray-600 font-medium">Vendor ID:</span>{' '}
                  <span className="font-mono text-blue-600">{winnerDetails?.id ?? winnerInfo.winnerId}</span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Vendor Name:</span>{' '}
                  <span className="font-medium">{winnerDetails?.contact_person ?? 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Company:</span>{' '}
                  <span className="font-medium">{winnerDetails?.company_name ?? 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Email:</span>{' '}
                  <span className="text-blue-600">{winnerDetails?.email ?? 'N/A'}</span>
                </div>
                {winnerDetails?.cpcb_registration_no && (
                  <div>
                    <span className="text-gray-600 font-medium">CPCB Registration:</span>{' '}
                    <span className="font-mono text-green-600">{winnerDetails.cpcb_registration_no}</span>
                  </div>
                )}
              </div>
              {!winnerDetails && !loadingVendor && vendorError && (
                <div className="text-xs text-red-500 bg-red-50 p-2 rounded border">
                  <div className="font-medium">Error loading vendor details:</div>
                  <div className="mt-1">{vendorError}</div>
                  <div className="mt-1 text-gray-600">Vendor ID: {winnerInfo.winnerId}</div>
                </div>
              )}
              {!winnerDetails && loadingVendor && (
                <div className="text-xs text-blue-500 bg-blue-50 p-2 rounded border">
                  <div className="animate-pulse flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                    Loading vendor details...
                  </div>
                </div>
              )}
              {!winnerDetails && !loadingVendor && !vendorError && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
                  <div>No vendor details available</div>
                  <div className="mt-1 text-gray-600">Vendor ID: {winnerInfo.winnerId}</div>
                </div>
              )}
            </div>
          </div>

          {/* Pickup Date Selection */}
          <div className="grid gap-2">
            <Label>Pickup Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < today}
                  showOutsideDays={false}
                  captionLayout="dropdown"
                  fromDate={today}
                  toDate={maxDate}
                  fromYear={currentYear}
                  toYear={currentYear + 2}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!date || submitting}>
            {submitting ? "Scheduling..." : "Schedule Pickup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
