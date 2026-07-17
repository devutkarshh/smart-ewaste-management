export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { listVendors } from "@/lib/server/data-mongo"

export async function GET() {
  const rows = await listVendors()
  return NextResponse.json(rows)
}
