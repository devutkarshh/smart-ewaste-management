export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getDb } from "@/lib/server/mongo"
import bcrypt from "bcryptjs"

// Simple guarded seeding route for development.
// Usage (default secret):
//   GET /api/dev/seed-users?secret=letmein
// Recommended: set SEED_SECRET in .env.local and use that instead of the default.

export async function GET(req: Request) {
  const url = new URL(req.url)
  const secret = url.searchParams.get("secret") || ""
  const expected = process.env.SEED_SECRET || "letmein"

  // Don’t allow in production without explicit secret match
  const isProd = process.env.NODE_ENV === "production"
  if (!secret || secret !== expected || isProd) {
    const reason = isProd ? "disabled in production" : "invalid or missing secret"
    return NextResponse.json({ ok: false, error: `Seeding ${reason}` }, { status: 403 })
  }

  try {
    const db = await getDb()

    // Ensure email uniqueness
    try {
      await db.collection("users").createIndex({ email: 1 }, { unique: true })
    } catch {}

    const defs = [
      { name: "Admin User", email: "admin@example.com", password: "admin123", role: "admin", department_id: 0 },
      { name: "Vendor One", email: "vendor1@example.com", password: "vendor123", role: "vendor", department_id: 0 },
      { name: "Student One", email: "student1@example.com", password: "student123", role: "student", department_id: 0 },
      { name: "Faculty One", email: "faculty1@example.com", password: "faculty123", role: "coordinator", department_id: 0 },
    ] as const

    let created = 0
    let skipped = 0

    for (const d of defs) {
      const existing = await db.collection("users").findOne({ email: d.email })
      if (existing) {
        skipped++
        continue
      }
      const passwordHash = await bcrypt.hash(d.password, 12)
      await db.collection("users").insertOne({
        name: d.name,
        email: d.email,
        passwordHash,
        role: d.role,
        department_id: d.department_id,
      })
      created++
    }

    return NextResponse.json({ ok: true, created, skipped, message: "Seed complete" })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Seed failed" }, { status: 500 })
  }
}
