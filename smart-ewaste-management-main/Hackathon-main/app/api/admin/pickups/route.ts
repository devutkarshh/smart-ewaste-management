export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { listAdminPickups } from "@/lib/server/data-mongo"

export async function GET() {
  try {
    const pickups = await listAdminPickups()
    return NextResponse.json(pickups)
  } catch (error) {
    console.error("Error fetching admin pickups:", error)
    return NextResponse.json({ error: "Failed to fetch pickups" }, { status: 500 })
  }
}
