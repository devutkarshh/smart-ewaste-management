export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { createUser, getUserByEmail, createSession } from "@/lib/server/auth-mongo"

export async function POST(req: Request) {
  try {
    const { name, email, password, role, department_id, autoLogin } = await req.json()
    if (!email || !password) return NextResponse.json({ error: "Missing email or password" }, { status: 400 })

    const existing = await getUserByEmail(email)
    if (existing) return NextResponse.json({ error: "User already exists" }, { status: 409 })

    await createUser({ name, email, password, role, department_id })

    // Optionally auto-login
    if (autoLogin) {
      const user = await getUserByEmail(email)
      if (user) {
        const s = await createSession(user)
        const res = NextResponse.json({ ok: true, user: s.user })
        res.cookies.set("sessionId", s.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 })
        return res
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to register" }, { status: 500 })
  }
}

