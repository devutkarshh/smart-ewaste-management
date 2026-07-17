export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { listItems, listDepartments, listVendors, type ItemCategory, type ItemStatus, type EwasteItem } from "@/lib/server/data-mongo"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const all = await listItems()
  const departments = await listDepartments()
  const vendors = await listVendors()
  
  const inRange = all.filter((i) => {
    const d = new Date(i.reported_date).getTime()
    const okFrom = from ? d >= new Date(from).getTime() : true
    const okTo = to ? d <= new Date(to).getTime() : true
    return okFrom && okTo
  })

  const byStatus: Record<ItemStatus, number> = {
    Reported: 0,
    "Awaiting Pickup": 0,
    Scheduled: 0,
    Collected: 0,
    Recycled: 0,
    Refurbished: 0,
    "Safely Disposed": 0,
  }
  const byCategory: Record<ItemCategory, number> = {
    Tablet: 0,
    Microwave: 0,
    "Air Conditioner": 0,
    TV: 0,
    "Washing Machine": 0,
    Laptop: 0,
    Smartphone: 0,
    Refrigerator: 0,
  }
  const byDisposition: Record<string, number> = {
    Recyclable: 0,
    Reusable: 0,
    Hazardous: 0,
    'Not Specified': 0,
  }
  const byDepartment: Record<string, number> = {}
  
  // Initialize department counts
  departments.forEach(dept => {
    byDepartment[dept.name] = 0
  })

  for (const it of inRange) {
    // Status breakdown
    byStatus[it.status as ItemStatus] = (byStatus[it.status as ItemStatus] || 0) + 1
    
    // Category breakdown
    byCategory[it.category as ItemCategory] = (byCategory[it.category as ItemCategory] || 0) + 1
    
    // Disposition breakdown
    const disposition = it.disposition || 'Not Specified'
    byDisposition[disposition] = (byDisposition[disposition] || 0) + 1
    
    // Department breakdown
    const dept = departments.find(d => d.id === it.department_id)
    if (dept) {
      byDepartment[dept.name] = (byDepartment[dept.name] || 0) + 1
    }
  }

  // Calculate environmental impact metrics
  const recycledCount = byStatus['Recycled'] || 0
  const refurbishedCount = byStatus['Refurbished'] || 0
  const safelyDisposedCount = byStatus['Safely Disposed'] || 0
  const totalProcessed = recycledCount + refurbishedCount + safelyDisposedCount
  const recoveryRate = inRange.length > 0 ? ((totalProcessed / inRange.length) * 100).toFixed(1) : '0'
  
  // Estimate environmental benefits (rough calculations for demonstration)
  const estimatedMetalRecovered = recycledCount * 0.5 // kg per laptop
  const estimatedPlasticRecovered = recycledCount * 0.3 // kg per laptop
  const estimatedCO2Saved = totalProcessed * 0.02 // tons CO2 equivalent
  const estimatedEnergyRecovered = recycledCount * 15 // kWh per device

  return NextResponse.json({ 
    from, 
    to, 
    total: inRange.length, 
    byStatus, 
    byCategory, 
    byDisposition,
    byDepartment,
    items: inRange,
    departments,
    vendors,
    environmentalImpact: {
      recoveryRate: parseFloat(recoveryRate),
      totalProcessed,
      estimatedMetalRecovered,
      estimatedPlasticRecovered,
      estimatedCO2Saved,
      estimatedEnergyRecovered
    }
  })
}

