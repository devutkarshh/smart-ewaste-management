export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { analyticsVolumeTrends } from "@/lib/server/data-mongo"

export async function GET() {
  try {
    const data = await analyticsVolumeTrends()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching volume trends analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch volume trends data" },
      { status: 500 }
    )
  }
}
