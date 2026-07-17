export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { listItems } from "@/lib/server/data-mongo"

export async function GET() {
  try {
    const items = await listItems()
    
    // Group items by disposition
    const dispositionCounts: Record<string, number> = {}
    items.forEach(item => {
      const disposition = item.disposition || 'Not Specified'
      dispositionCounts[disposition] = (dispositionCounts[disposition] || 0) + 1
    })

    // Convert to array format for charts
    const data = Object.entries(dispositionCounts).map(([disposition, count]) => ({
      disposition,
      count,
      percentage: items.length > 0 ? ((count / items.length) * 100).toFixed(1) : "0"
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching disposition distribution analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch disposition distribution data" },
      { status: 500 }
    )
  }
}
