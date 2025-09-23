export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getSDGMappings } from "@/lib/server/data-mongo"

export async function GET() {
  try {
    const mappings = await getSDGMappings()
    return NextResponse.json(mappings)
  } catch (error: any) {
    console.error("Error fetching SDG mappings:", error)
    return NextResponse.json({ error: "Internal server error", details: error?.message || "Unknown error" }, { status: 500 })
  }
}
