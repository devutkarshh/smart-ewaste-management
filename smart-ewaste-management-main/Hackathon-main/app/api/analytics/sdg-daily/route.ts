export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSDGAnalyticsDailyRange } from "@/lib/server/data-mongo"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || '2024-01-01'
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    
    const dailyData = await getSDGAnalyticsDailyRange(startDate, endDate)
    
    return NextResponse.json(dailyData)
  } catch (error: any) {
    console.error("Error fetching SDG daily analytics:", error)
    return NextResponse.json({ error: "Internal server error", details: error?.message || "Unknown error" }, { status: 500 })
  }
}
