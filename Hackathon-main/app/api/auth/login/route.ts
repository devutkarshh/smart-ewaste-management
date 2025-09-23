export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getUserByEmail, createSession } from "@/lib/server/auth-mongo"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  let email = ""
  let password = ""
  let from = ""
  const ct = req.headers.get("content-type") || ""
  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({} as any))
    email = body.email || ""
    password = body.password || ""
    from = body.from || ""
  } else if (ct.includes("application/x-www-form-urlencoded")) {
    const body = await req.formData().catch(() => null)
    email = (body?.get("email") as string) || ""
    password = (body?.get("password") as string) || ""
    from = (body?.get("from") as string) || ""
  } else {
    // Try to parse formData for plain form posts without explicit content-type
    const body = await req.formData().catch(() => null)
    email = (body?.get("email") as string) || ""
    password = (body?.get("password") as string) || ""
    from = (body?.get("from") as string) || ""
  }
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }
  try {
    const user = await getUserByEmail(email)
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    const s = await createSession(user)

    // Determine redirect target: prefer provided 'from' (if safe), otherwise by role
    const safeFrom = typeof from === "string" && from.startsWith("/") && !from.startsWith("/login") ? from : ""
    const roleTarget = s.user.role === "admin" ? "/admin" : s.user.role === "vendor" ? "/vendor/scan" : "/report"
    const target = safeFrom || roleTarget

    // Build absolute URL for redirect based on current origin
    const url = new URL(req.url)
    url.pathname = target
    url.search = ""

    const res = NextResponse.redirect(url, 303)
    // New opaque session id for Mongo-backed sessions
    res.cookies.set("sessionId", s.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 })
    // Legacy JSON session cookie for middleware/nav compatibility (contains only minimal info)
    const legacy = { user: { user_id: s.user.user_id, email: s.user.email, role: s.user.role } }
    res.cookies.set("session", JSON.stringify(legacy), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Login failed" }, { status: 500 })
  }
}