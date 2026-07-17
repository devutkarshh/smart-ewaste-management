import { NextResponse } from "next/server"
import { getSession } from "@/lib/server/auth"

export async function GET() {
  try {
    const session = await getSession()
    return NextResponse.json(session || { user: null })
  } catch (error) {
    console.error("Error fetching session:", error)
    return NextResponse.json({ user: null })
  }
}

