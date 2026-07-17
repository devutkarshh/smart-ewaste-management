export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { listItems } from "@/lib/server/data-mongo"

export async function GET() {
  try {
    const items = await listItems()
    
    // Group items by status
    const statusCounts: Record<string, number> = {}
    items.forEach(item => {
      const status = item.status || 'Unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    // Convert to array format for charts
    const data = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: items.length > 0 ? ((count / items.length) * 100).toFixed(1) : "0"
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching status distribution analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch status distribution data" },
      { status: 500 }
    )
  }
}
