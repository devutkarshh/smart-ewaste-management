export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { listDepartments } from "@/lib/server/data-mongo"

export async function GET() {
  const rows = await listDepartments()
  return NextResponse.json(rows)
}
