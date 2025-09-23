"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AppNav } from "@/components/app-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import QRCode from "qrcode"

type Department = { id: number; name: string; location: string }
type Item = {
  id: string
  name: string
  description?: string
  category: string
  department_id: number
  reported_by: string
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
}

export default function ReportPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [brandOpen, setBrandOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Memoize brands array to prevent re-renders
  const brands = useMemo(() => [
    'HP', 'OnePlus', 'Lenovo', 'Sony', 'Samsung', 'Blue Star',
    'Daikin', 'LG', 'Morphy Richards', 'Voltas', 'Apple', 'IFB',
    'Vivo', 'Bosch', 'TCL', 'Acer', 'Huawei', 'Whirlpool', 'Panasonic',
    'Dell', 'Asus', 'Realme', 'Carrier', 'Xiaomi', 'Godrej'
  ], [])
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Tablet",
    department_id: "",
    reported_by: "",
    disposition: "",
    brand: "",
    build_quality: "",
    user_lifespan: "",
    usage_pattern: "",
    expiry_years: "",
    condition: "",
    original_price: "",
    used_duration: "",
  })
  const [created, setCreated] = useState<Item | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [predictedPrice, setPredictedPrice] = useState<number | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [customPrice, setCustomPrice] = useState<string>("")
  const [priceConfirmed, setPriceConfirmed] = useState(false)
  const [customPriceError, setCustomPriceError] = useState<string>("")

  useEffect(() => {
    // Use Promise.allSettled for parallel loading with better error handling
    const loadInitialData = async () => {
      try {
        const results = await Promise.allSettled([
          fetch("/api/departments").then(r => r.ok ? r.json() : []),
          fetch("/api/auth/session").then(r => r.ok ? r.json() : null).catch(() => null)
        ])

        if (results[0].status === 'fulfilled') {
          setDepartments(results[0].value)
        } else {
          console.error('Error loading departments:', results[0].reason)
        }
        
        if (results[1].status === 'fulfilled' && results[1].value?.user?.email) {
          const email = results[1].value.user.email
          setForm((f) => f.reported_by ? f : { ...f, reported_by: email })
        }
      } catch (error) {
        console.error('Error in initial data loading:', error)
      }
    }

    loadInitialData()
  }, [])

  // Auto-fill expiry_years with user_lifespan
  useEffect(() => {
    if (form.user_lifespan && !form.expiry_years) {
      setForm(f => ({ ...f, expiry_years: f.user_lifespan }))
    }
  }, [form.user_lifespan, form.expiry_years])

  // Function to predict price using ML API
  const predictPrice = useCallback(async () => {
    if (!form.category || !form.original_price || !form.used_duration || !form.user_lifespan || !form.condition || !form.build_quality) {
      return
    }

    setPriceLoading(true)
    try {
      const response = await fetch("/api/predict-price", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          original_price: Number(form.original_price),
          used_duration: Number(form.used_duration),
          user_lifespan: Number(form.user_lifespan),
          condition: Number(form.condition),
          build_quality: Number(form.build_quality),
          brand: form.brand,
          usage_pattern: form.usage_pattern,
          expiry_years: Number(form.expiry_years)
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPredictedPrice(data.predicted_price)
        // Reset price confirmation when new prediction is fetched
        setPriceConfirmed(false)
      }
    } catch (error) {
      console.error("Error predicting price:", error)
    } finally {
      setPriceLoading(false)
    }
  }, [form])

  // Auto-predict price when required fields are filled
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (form.category && form.original_price && form.used_duration && form.user_lifespan && form.condition && form.build_quality) {
        predictPrice()
        // Reset price confirmation when fields change
        setPriceConfirmed(false)
      }
    }, 1000) // Debounce for 1 second

    return () => clearTimeout(debounceTimer)
  }, [form.category, form.original_price, form.used_duration, form.user_lifespan, form.condition, form.build_quality, predictPrice])

  // Function to validate custom price input
  const validateCustomPrice = useCallback((priceValue: string) => {
    if (!priceValue) {
      setCustomPriceError("")
      return
    }
    
    const customPriceNum = Number(priceValue)
    const originalPriceNum = Number(form.original_price)
    
    if (isNaN(customPriceNum)) {
      setCustomPriceError("Please enter a valid number")
      return
    }
    
    if (customPriceNum < 0) {
      setCustomPriceError("Price cannot be negative")
      return
    }
    
    if (originalPriceNum && customPriceNum >= originalPriceNum) {
      setCustomPriceError(`Price must be lower than the original cost price (₹${originalPriceNum.toLocaleString()})`)
      return
    }
    
    setCustomPriceError("")
  }, [form.original_price])

  // Auto-validate custom price when it changes
  useEffect(() => {
    validateCustomPrice(customPrice)
  }, [customPrice, validateCustomPrice])

  const canSubmit = useMemo(() => {
    // Check basic required fields
    if (!form.name || !form.category || !form.department_id || !form.reported_by) return false
    
    // Check if price is confirmed and custom price is entered
    if (!priceConfirmed) return false
    if (!customPrice || Number(customPrice) <= 0) return false
    
    // Check that numeric fields are not negative
    const numericFields = [
      form.user_lifespan,
      form.expiry_years,
      form.original_price,
      form.used_duration
    ]
    
    for (const field of numericFields) {
      if (field && Number(field) < 0) return false
    }
    
    // Check that custom price is valid
    if (customPrice) {
      const customPriceNum = Number(customPrice)
      const originalPriceNum = Number(form.original_price)
      if (isNaN(customPriceNum) || customPriceNum < 0) return false
      // Prevent custom price from being >= original price
      if (originalPriceNum && customPriceNum >= originalPriceNum) return false
      // Check for any validation errors
      if (customPriceError) return false
    }
    
    return true
  }, [form, priceConfirmed, customPrice, customPriceError])

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      // Only use user-entered price - no ML price selection
      const userEnteredPrice = customPrice ? Number(customPrice) : 0

      const submitData = {
        name: form.name,
        description: form.description || undefined,
        category: form.category,
        department_id: Number(form.department_id),
        reported_by: form.reported_by,
        disposition: form.disposition || undefined,
        brand: form.brand || undefined,
        build_quality: form.build_quality || undefined,
        user_lifespan: form.user_lifespan || undefined,
        usage_pattern: form.usage_pattern || undefined,
        expiry_years: form.expiry_years || undefined,
        condition: form.condition || undefined,
        original_price: form.original_price || undefined,
        used_duration: form.used_duration || undefined,
        current_price: userEnteredPrice, // Only user-entered price
        predicted_price: predictedPrice || 0, // Store ML prediction for reference only
        price_confirmed: true,
      };

      console.log("=== SIMPLIFIED PRICE TRACKING ===");
      console.log("Submitting item with data:", submitData);
      console.log("User input - customPrice:", customPrice);
      console.log("ML predicted - predictedPrice:", predictedPrice);
      console.log("Final user price - userEnteredPrice:", userEnteredPrice);
      console.log("Price confirmed:", submitData.price_confirmed);
      console.log("====================================");

      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(submitData),
      })
      if (!res.ok) {
        alert("Failed to create item")
        return
      }
      const item: Item = await res.json()
      setCreated(item)
      
      // Generate QR code with optimized settings for performance
      const dataUrl = await QRCode.toDataURL(item.id, { 
        margin: 1, 
        scale: 4, // Reduced from 6 for faster generation
        width: 200, // Set explicit width for consistent sizing
        errorCorrectionLevel: 'M' // Medium error correction for balance
      })
      setQrDataUrl(dataUrl)
      
      // Auto-scroll to top of page after QR code creation
      requestAnimationFrame(() => {
        window.scrollTo({ 
          top: 0, 
          behavior: 'smooth' 
        })
      })
    } catch (error) {
      console.error('Error submitting form:', error)
      alert("Failed to create item")
    } finally {
      setIsSubmitting(false)
    }
  }, [form, isSubmitting])

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#9ac37e]/5 to-transparent">
      <AppNav />
      <section className="container mx-auto max-w-7xl py-4 sm:py-6 md:py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          <Card className="border-[#9ac37e]/20 shadow-md hover:shadow-lg transition-shadow duration-200 w-full">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-[#3e5f44] text-lg sm:text-xl font-bold">Report e‑waste</CardTitle>
              <CardDescription className="text-[#3e5f44]/70 text-sm sm:text-base">Fill in the details to generate a QR tag for this item.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form className="grid gap-4" onSubmit={onSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-sm font-medium">Item name</Label>
                  <Input 
                    id="name" 
                    value={form.name} 
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
                    placeholder="e.g. Dell Latitude E5450"
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc" className="text-sm font-medium">Description</Label>
                  <Textarea 
                    id="desc" 
                    value={form.description} 
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} 
                    placeholder="Condition, asset tag, notes..." 
                    className="w-full min-h-[80px] resize-y"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tablet">Tablet</SelectItem>
                      <SelectItem value="Microwave">Microwave</SelectItem>
                      <SelectItem value="Air Conditioner">Air Conditioner</SelectItem>
                      <SelectItem value="TV">TV / Monitor</SelectItem>
                      <SelectItem value="Washing Machine">Washing Machine</SelectItem>
                      <SelectItem value="Laptop">Laptop</SelectItem>
                      <SelectItem value="Smartphone">Smartphone</SelectItem>
                      <SelectItem value="Refrigerator">Refrigerator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Disposition</Label>
                  <Select value={form.disposition} onValueChange={(v) => setForm((f) => ({ ...f, disposition: v }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select disposition (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Recyclable">Recyclable</SelectItem>
                      <SelectItem value="Reusable">Reusable</SelectItem>
                      <SelectItem value="Hazardous">Hazardous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Brand</Label>
                  <Popover open={brandOpen} onOpenChange={setBrandOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={brandOpen}
                        className="w-full justify-between h-10"
                      >
                        <span className="truncate">
                          {form.brand
                            ? brands.find((brand) => brand === form.brand)
                            : "Select brand..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full max-w-sm p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search brand..." className="h-9" />
                        <CommandList className="max-h-60">
                          <CommandEmpty>No brand found.</CommandEmpty>
                          <CommandGroup>
                            {brands.map((brand) => (
                              <CommandItem
                                key={brand}
                                value={brand}
                                onSelect={(currentValue) => {
                                  setForm((f) => ({ ...f, brand: currentValue === form.brand ? "" : currentValue }))
                                  setBrandOpen(false)
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.brand === brand ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {brand}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Build Quality (1=Low, 5=High)</Label>
                  <Select value={form.build_quality} onValueChange={(v) => setForm((f) => ({ ...f, build_quality: v }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select build quality" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Low Quality</SelectItem>
                      <SelectItem value="2">2 - Below Average</SelectItem>
                      <SelectItem value="3">3 - Average</SelectItem>
                      <SelectItem value="4">4 - Good Quality</SelectItem>
                      <SelectItem value="5">5 - High Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user_lifespan">Expected Lifespan (in years)</Label>
                  <Input 
                    id="user_lifespan" 
                    type="number" 
                    step="0.1" 
                    min="0"
                    value={form.user_lifespan} 
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "" || Number(value) >= 0) {
                        setForm((f) => ({ ...f, user_lifespan: value }))
                      }
                    }} 
                    placeholder="e.g. 3.5" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Usage Pattern</Label>
                  <Select value={form.usage_pattern} onValueChange={(v) => setForm((f) => ({ ...f, usage_pattern: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select usage pattern" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Light">Light</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiry_years">Expiry (in years)</Label>
                  <Input 
                    id="expiry_years" 
                    type="number" 
                    step="0.1" 
                    min="0"
                    value={form.expiry_years} 
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "" || Number(value) >= 0) {
                        setForm((f) => ({ ...f, expiry_years: value }))
                      }
                    }} 
                    placeholder="Auto-filled from expected lifespan or enter manually" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Condition (1=Poor, 5=Excellent)</Label>
                  <Select value={form.condition} onValueChange={(v) => setForm((f) => ({ ...f, condition: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Poor Condition</SelectItem>
                      <SelectItem value="2">2 - Below Average</SelectItem>
                      <SelectItem value="3">3 - Average</SelectItem>
                      <SelectItem value="4">4 - Good Condition</SelectItem>
                      <SelectItem value="5">5 - Excellent Condition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="original_price">Cost Price (₹)</Label>
                  <Input 
                    id="original_price" 
                    type="number" 
                    step="0.01" 
                    min="0"
                    value={form.original_price} 
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "" || Number(value) >= 0) {
                        setForm((f) => ({ ...f, original_price: value }))
                      }
                    }} 
                    placeholder="e.g. 50000.00" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="used_duration">Usage Duration (in years)</Label>
                  <Input 
                    id="used_duration" 
                    type="number" 
                    step="0.1" 
                    min="0"
                    value={form.used_duration} 
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "" || Number(value) >= 0) {
                        setForm((f) => ({ ...f, used_duration: value }))
                      }
                    }} 
                    placeholder="e.g. 2.5" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Department</Label>
                  <Select value={form.department_id} onValueChange={(v) => setForm((f) => ({ ...f, department_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reported_by">Your name or email</Label>
                  <Input id="reported_by" value={form.reported_by} onChange={(e) => setForm((f) => ({ ...f, reported_by: e.target.value }))} placeholder="e.g. alex@campus.edu" />
                </div>

                {/* ML Price Prediction Section */}
                {predictedPrice !== null && (
                  <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/50 dark:to-green-950/50">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold text-blue-700 dark:text-blue-300">
                          🤖 Predicted Price (ML-based)
                        </Label>
                        {priceLoading && <div className="text-sm text-muted-foreground">Calculating...</div>}
                      </div>
                      
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ML Prediction: ₹{predictedPrice.toLocaleString()}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        This is our AI's price estimate based on your item's specifications.
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="user-price" className="font-medium">
                            Enter Your Price (Required)
                          </Label>
                          <div className="text-xs text-muted-foreground">
                            Set the price for this item. You can use the ML prediction as reference.
                          </div>
                          
                          <Input
                            id="user-price"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Enter your price"
                            value={customPrice}
                            onChange={(e) => {
                              setCustomPrice(e.target.value)
                              setPriceConfirmed(false) // Reset confirmation when price changes
                            }}
                            className={`max-w-xs ${customPriceError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                          />
                          {customPriceError && (
                            <div className="text-sm text-red-600 dark:text-red-400">
                              ⚠️ {customPriceError}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        💡 Our AI considers category, condition, age, brand, and market trends to provide the estimate above.
                      </div>
                      
                      {/* Confirmation Button */}
                      <div className="pt-3 border-t border-blue-200">
                        <Button
                          type="button"
                          onClick={() => setPriceConfirmed(true)}
                          disabled={priceConfirmed || (!customPrice || Number(customPrice) <= 0 || !!customPriceError)}
                          className={`w-full ${
                            priceConfirmed 
                              ? "bg-green-600 hover:bg-green-600 text-white" 
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {priceConfirmed ? (
                            <>✓ Price Confirmed</>
                          ) : (!customPrice || Number(customPrice) <= 0 || !!customPriceError) ? (
                            <>Enter a valid price to confirm</>
                          ) : (
                            <>Confirm Price</>
                          )}
                        </Button>
                        {priceConfirmed && (
                          <div className="text-center p-3 bg-green-50 dark:bg-green-950/50 rounded-md border border-green-200 dark:border-green-800">
                            <div className="text-sm font-medium text-green-700 dark:text-green-300">
                              ✓ Price Confirmed
                            </div>
                            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Using your price: ₹{Number(customPrice).toLocaleString()}
                            </div>
                            {predictedPrice && (
                              <div className="text-xs text-gray-500 mt-1">
                                (ML predicted: ₹{predictedPrice.toLocaleString()})
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={!canSubmit || isSubmitting} 
                  className="bg-[#3e5f44] hover:bg-[#4a6e50] disabled:opacity-50 text-white w-full sm:w-auto transition-colors duration-200"
                >
                  {isSubmitting 
                    ? "Creating..." 
                    : !priceConfirmed && (predictedPrice !== null || customPrice)
                    ? "Confirm price to continue" 
                    : "Create & generate QR"
                  }
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card className="border-[#9ac37e]/20 shadow-lg hover:shadow-xl transition-all duration-200" id="qr-section">
            <CardHeader>
              <CardTitle>QR Tag</CardTitle>
              <CardDescription>Print and attach this QR to the item.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
              {created ? (
                <>
                  <div className="text-center">
                    <div className="font-semibold">{created.name}</div>
                    <div className="text-muted-foreground text-sm">{created.category} · Dept #{created.department_id}</div>
                  </div>
                  {qrDataUrl ? (
                    <>
                      <img 
                        src={qrDataUrl || "/placeholder.svg"} 
                        alt="QR code for item" 
                        className="border rounded p-2 bg-white" 
                        width="200" 
                        height="200"
                        loading="lazy"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <a href={qrDataUrl} download={`ewaste-${created.id}.png`} className="text-sm underline inline-block w-full sm:w-auto text-center sm:text-left">Download QR</a>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">Generating QR...</div>
                  )}
                  <div className="text-sm text-muted-foreground">Item ID: {created.id}</div>
                  
                  {/* Add Start Auction Button */}
                  <div className="w-full pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => window.location.href = `/start-auction/${created.id}`}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      🏆 Start Auction for This Item
                    </Button>
                    <div className="text-xs text-center text-gray-500 mt-2">
                      Let vendors bid on your item to get the best price
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground text-sm">Submit the form to see the QR code here.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
