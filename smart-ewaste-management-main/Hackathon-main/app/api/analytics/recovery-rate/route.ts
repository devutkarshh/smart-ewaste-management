export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { analyticsRecoveryRate } from "@/lib/server/data-mongo"

export async function GET() {
  try {
    const data = await analyticsRecoveryRate()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching recovery rate analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch recovery rate data" },
      { status: 500 }
    )
  }
}
