export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getSessionById } from "@/lib/server/auth-mongo"

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || ""
  const id = cookie.match(/sessionId=([^;]+)/)?.[1]
  if (!id) return NextResponse.json({ user: null })
  const s = await getSessionById(id)
  if (!s) return NextResponse.json({ user: null })
  return NextResponse.json({ user: { role: s.role, user_id: String(s.userId) } })
}

