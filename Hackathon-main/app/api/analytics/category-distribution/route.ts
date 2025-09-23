export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { analyticsCategoryDistribution } from "@/lib/server/data-mongo"

export async function GET() {
  try {
    const data = await analyticsCategoryDistribution()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching category distribution analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch category distribution data" },
      { status: 500 }
    )
  }
}
