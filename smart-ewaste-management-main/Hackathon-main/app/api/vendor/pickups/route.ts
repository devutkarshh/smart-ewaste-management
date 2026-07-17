export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getSession } from "@/lib/server/auth"
import { listVendorPickups } from "@/lib/server/data-mongo"
import { getDb } from "@/lib/server/mongo"
import { ObjectId } from "mongodb"

export async function GET() {
  const session = await getSession()
  const userId = session?.user?.user_id || ""
  
  if (!userId) return NextResponse.json([])

  // Resolve the vendor_id associated with this logged-in vendor user.
  // Strategy: look up the user document by _id to get their email; then find a vendor with the same email.
  // This avoids mismatches between user._id and vendor._id.
  const db = await getDb()
  let vendorId = ""
  try {
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    const email = (user as any)?.email || ""
    if (email) {
      const vendor = await db.collection("vendors").findOne({ email })
      if (vendor?._id) vendorId = String(vendor._id)
    }
  } catch (error) {
    console.log("Vendor pickups API - Error in vendor lookup:", error)
  }

  if (!vendorId) {
    // Fallback: if user has vendor_id field linking to vendors, try that
    try {
      const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
      const alt = (user as any)?.vendor_id
      if (alt) vendorId = String(alt)
    } catch {}
  }

  if (!vendorId) return NextResponse.json([])

  const pickups = await listVendorPickups(vendorId)
  return NextResponse.json(pickups)
}

