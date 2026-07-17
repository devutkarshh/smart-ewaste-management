export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getVendorById } from "@/lib/server/data-mongo"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const vendor = await getVendorById(params.id)
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }
    return NextResponse.json(vendor)
  } catch (error) {
    console.error("Error fetching vendor:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
