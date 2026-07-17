export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { createCampaign, listCampaigns } from "@/lib/server/data-mongo"

export async function GET() {
  const rows = await listCampaigns()
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body?.title || !body?.date) {
    return NextResponse.json({ error: "title and date are required" }, { status: 400 })
  }
  const c = await createCampaign({ title: body.title, date: body.date, description: body.description })
  return NextResponse.json(c)
}

