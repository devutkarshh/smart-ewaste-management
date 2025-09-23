"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Recycle, Factory, Users, Shield, Globe, Info, CalendarRange, CalendarIcon } from "lucide-react"
import { format, subDays, subMonths } from "date-fns"
import { cn } from "@/lib/utils"

interface SDGMetrics {
  diverted_kg: number
  recycled_kg: number
  collected_kg: number
  refurb_kg: number
  recycling_rate_pct: number
  refurb_rate_pct: number
  ghg_avoided_kgco2e: number
  hazardous_processed_count: number
  green_jobs_hours: number
}

interface SDGMapping {
  id: string
  sdg: string
  target: string
  indicator_key: string
  title: string
  formula_text: string
  unit: string
  preferred_chart: string
  breakdowns: string[]
  quality_note: string
  goal_direction: string
}

interface SDGDailyData {
  id: string
  date: string
  kpis: SDGMetrics
  breakdowns: {
    by_city: Array<{ city: string; diverted_kg: number; recycling_rate_pct: number; ghg_avoided_kgco2e: number }>
    by_category: Array<{ category: string; diverted_kg: number; ghg_avoided_kgco2e: number }>
    by_vendor: Array<{ vendor: string; diverted_kg: number; recycling_rate_pct: number }>
  }
}

const SDG_COLORS = {
  "SDG 12": "#bf8b2e",
  "SDG 13": "#3f7e44",
  "SDG 8": "#a21942",
  "SDG 3": "#4c9f38",
  "SDG 11": "#fd9d24"
}

export default function SDGImpactAnalytics() {
  const [metrics, setMetrics] = useState<SDGMetrics | null>(null)
  const [mappings, setMappings] = useState<SDGMapping[]>([])
  const [dailyData, setDailyData] = useState<SDGDailyData[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30d")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedCity, setSelectedCity] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Get current date and calculate year range dynamically for calendars
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
  const minCalendarDate = new Date(2020, 0, 1) // January 1, 2020

  // Convert string dates to Date objects for calendar components
  const startDateObj = startDate ? new Date(startDate) : undefined
  const endDateObj = endDate ? new Date(endDate) : undefined

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (dateRange !== "custom") {
      loadData()
    }
  }, [dateRange])

  // Auto-reload when custom dates change
  useEffect(() => {
    if (dateRange === "custom" && startDate && endDate) {
      loadData()
    }
  }, [dateRange, startDate, endDate])

  const loadData = async () => {
    setLoading(true)
    try {
      let start = startDate
      let end = endDate

      if (dateRange !== "custom") {
        const today = new Date()
        end = format(today, "yyyy-MM-dd")
        
        switch (dateRange) {
          case "7d":
            start = format(subDays(today, 7), "yyyy-MM-dd")
            break
          case "30d":
            start = format(subDays(today, 30), "yyyy-MM-dd")
            break
          case "90d":
            start = format(subDays(today, 90), "yyyy-MM-dd")
            break
          case "1y":
            start = format(subMonths(today, 12), "yyyy-MM-dd")
            break
          default:
            start = format(subDays(today, 30), "yyyy-MM-dd")
        }
        setStartDate(start)
        setEndDate(end)
      }

      // Ensure we have valid dates before making API calls
      if (!start || !end) {
        console.warn("Missing start or end date, skipping API calls")
        return
      }

      // Load current metrics
      const metricsRes = await fetch(`/api/analytics/sdg-metrics?startDate=${start}&endDate=${end}`)
      if (metricsRes.ok) {
        setMetrics(await metricsRes.json())
      }

      // Load SDG mappings
      const mappingsRes = await fetch("/api/analytics/sdg-mappings")
      if (mappingsRes.ok) {
        setMappings(await mappingsRes.json())
      }

      // Load daily data for trends
      const dailyRes = await fetch(`/api/analytics/sdg-daily?startDate=${start}&endDate=${end}`)
      if (dailyRes.ok) {
        setDailyData(await dailyRes.json())
      }

    } catch (error) {
      console.error("Error loading SDG data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomDateSubmit = () => {
    if (startDate && endDate) {
      loadData()
    }
  }

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setStartDate(format(date, "yyyy-MM-dd"))
    }
  }

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      setEndDate(format(date, "yyyy-MM-dd"))
    }
  }

  const getSDGIcon = (sdg: string) => {
    switch (sdg) {
      case "SDG 12": return <Recycle className="h-4 w-4" />
      case "SDG 13": return <Globe className="h-4 w-4" />
      case "SDG 8": return <Users className="h-4 w-4" />
      case "SDG 3": return <Shield className="h-4 w-4" />
      case "SDG 11": return <Factory className="h-4 w-4" />
      default: return <TrendingUp className="h-4 w-4" />
    }
  }

  const groupMappingsBySDG = () => {
    const grouped = mappings.reduce((acc, mapping) => {
      if (!acc[mapping.sdg]) {
        acc[mapping.sdg] = []
      }
      acc[mapping.sdg].push(mapping)
      return acc
    }, {} as Record<string, SDGMapping[]>)
    return grouped
  }

  const formatValue = (value: number, unit: string) => {
    if (unit === "kg") {
      return `${value.toLocaleString()} kg`
    } else if (unit === "%") {
      return `${value.toFixed(1)}%`
    } else if (unit === "kgCO₂e") {
      return `${value.toLocaleString()} kgCO₂e`
    } else if (unit === "hours") {
      return `${value.toLocaleString()} hrs`
    } else {
      return value.toLocaleString()
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const sdgGroups = groupMappingsBySDG()

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SDG Impact Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Project-level proxy indicators for UN Sustainable Development Goals
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {dateRange === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="grid gap-2">
                <Label className="text-xs">From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal text-xs",
                        !startDateObj && "text-muted-foreground"
                      )}
                      size="sm"
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {startDateObj ? format(startDateObj, "MMM dd, yyyy") : <span>Pick start date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDateObj}
                      onSelect={handleStartDateChange}
                      disabled={(date) => date > today}
                      showOutsideDays={false}
                      captionLayout="dropdown"
                      fromDate={minCalendarDate}
                      toDate={today}
                      fromYear={2020}
                      toYear={currentYear}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid gap-2">
                <Label className="text-xs">To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal text-xs",
                        !endDateObj && "text-muted-foreground"
                      )}
                      size="sm"
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {endDateObj ? format(endDateObj, "MMM dd, yyyy") : <span>Pick end date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDateObj}
                      onSelect={handleEndDateChange}
                      disabled={(date) => {
                        if (startDateObj) {
                          return date < startDateObj || date > today
                        }
                        return date > today
                      }}
                      showOutsideDays={false}
                      captionLayout="dropdown"
                      fromDate={startDateObj || minCalendarDate}
                      toDate={today}
                      fromYear={startDateObj ? startDateObj.getFullYear() : 2020}
                      toYear={currentYear}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex items-end">
                <Button onClick={handleCustomDateSubmit} size="sm" className="w-full">
                  <CalendarRange className="h-3 w-3 mr-1" />
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top-level KPIs */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">E-waste Diverted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatValue(metrics.diverted_kg, "kg")}
              </div>
              <Badge variant="outline" className="text-xs mt-2">
                SDG 12.5 Proxy
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Recycling Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatValue(metrics.recycling_rate_pct, "%")}
              </div>
              <Badge variant="outline" className="text-xs mt-2">
                SDG 12.5 Proxy
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">GHG Avoided</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatValue(metrics.ghg_avoided_kgco2e, "kgCO₂e")}
              </div>
              <Badge variant="outline" className="text-xs mt-2">
                SDG 13.3 Proxy
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Green Jobs Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatValue(metrics.green_jobs_hours, "hours")}
              </div>
              <Badge variant="outline" className="text-xs mt-2">
                SDG 8.5 Proxy
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdowns">Breakdowns</TabsTrigger>
          <TabsTrigger value="sdgs">By SDG</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Recycle className="h-5 w-5 text-green-600" />
                    Processing Efficiency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Collected</span>
                      <span className="font-medium">{formatValue(metrics.collected_kg, "kg")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Recycled</span>
                      <span className="font-medium text-green-600">{formatValue(metrics.recycled_kg, "kg")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Refurbished</span>
                      <span className="font-medium text-blue-600">{formatValue(metrics.refurb_kg, "kg")}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Diverted</span>
                        <span className="font-bold text-lg">{formatValue(metrics.diverted_kg, "kg")}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Environmental Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">GHG Avoided</span>
                      <span className="font-medium text-green-600">{formatValue(metrics.ghg_avoided_kgco2e, "kgCO₂e")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Hazardous Items Processed</span>
                      <span className="font-medium">{metrics.hazardous_processed_count}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Green Jobs Generated</span>
                      <span className="font-medium text-purple-600">{formatValue(metrics.green_jobs_hours, "hours")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {dailyData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>E-waste Diverted Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(new Date(value), "MMM dd")}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => format(new Date(value), "MMM dd, yyyy")}
                        formatter={(value: any) => [`${value} kg`, "Diverted"]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="kpis.diverted_kg" 
                        stroke="#059669" 
                        strokeWidth={2}
                        dot={{ fill: "#059669", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>GHG Emissions Avoided</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(new Date(value), "MMM dd")}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => format(new Date(value), "MMM dd, yyyy")}
                        formatter={(value: any) => [`${value} kgCO₂e`, "Avoided"]}
                      />
                      <Bar 
                        dataKey="kpis.ghg_avoided_kgco2e" 
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="breakdowns" className="space-y-4">
          {dailyData.length > 0 && dailyData[0]?.breakdowns && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By City */}
              <Card>
                <CardHeader>
                  <CardTitle>Impact by City</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyData[0].breakdowns.by_city}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="city" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [`${value} kg`, "Diverted"]} />
                      <Bar dataKey="diverted_kg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* By Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Impact by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyData[0].breakdowns.by_category}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [`${value} kg`, "Diverted"]} />
                      <Bar dataKey="diverted_kg" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sdgs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(sdgGroups).map(([sdg, sdgMappings]) => (
              <Card key={sdg} className="border-l-4" style={{ borderLeftColor: SDG_COLORS[sdg as keyof typeof SDG_COLORS] }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getSDGIcon(sdg)}
                    {sdg}
                  </CardTitle>
                  <CardDescription>
                    {sdgMappings.length} indicator{sdgMappings.length !== 1 ? 's' : ''} tracked
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sdgMappings.map((mapping) => {
                      const value = metrics ? (metrics as any)[mapping.indicator_key] : 0
                      return (
                        <div key={mapping.id} className="flex flex-col space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{mapping.title}</span>
                            <span className="text-sm font-bold">{formatValue(value, mapping.unit)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {mapping.target}
                            </Badge>
                            <span className="text-xs text-gray-500">{mapping.quality_note}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Important Note</p>
              <p>
                These are project-level proxy indicators and estimates, not official UN SDG statistics. 
                Emission factors are based on industry estimates and may vary by region and specific circumstances.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
