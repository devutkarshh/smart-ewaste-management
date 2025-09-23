export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/server/auth"
import { updateVendorResponse } from "@/lib/server/data-mongo"
import { getDb } from "@/lib/server/mongo"
import { ObjectId } from "mongodb"

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    const userId = session?.user?.user_id || ""
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Resolve the vendor_id associated with this logged-in vendor user
    const db = await getDb()
    let vendorId = ""
    try {
      const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
      const email = (user as any)?.email || ""
      if (email) {
        const vendor = await db.collection("vendors").findOne({ email })
        if (vendor?._id) vendorId = String(vendor._id)
      }
    } catch {
      // ignore
    }

    if (!vendorId) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const body = await req.json()
    const { pickup_id, response, note } = body

    if (!pickup_id || !response || !["Accepted", "Rejected"].includes(response)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    const success = await updateVendorResponse(pickup_id, vendorId, response, note)
    
    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to update response" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error updating vendor response:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
