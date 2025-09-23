export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { schedulePickup } from "@/lib/server/data-mongo"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const pick = await schedulePickup({
    admin_id: body.admin_id,
    vendor_id: body.vendor_id,
    scheduled_date: body.scheduled_date,
    item_ids: body.item_ids || [],
  })
  return NextResponse.json(pick)
}
