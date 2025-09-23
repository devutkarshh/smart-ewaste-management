export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { listVendors } from "@/lib/server/data-mongo"

export async function GET() {
  try {
    const vendors = await listVendors()
    
    return NextResponse.json({
      vendors,
      message: "Vendor data retrieved successfully"
    })
  } catch (error: any) {
    console.error("Debug vendors error:", error)
    return NextResponse.json({ error: "Internal server error", details: error?.message || "Unknown error" }, { status: 500 })
  }
}
