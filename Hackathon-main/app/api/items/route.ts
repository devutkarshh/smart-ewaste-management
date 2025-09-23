export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { createItem, listItems, type ItemCategory, type ItemStatus, type Disposition } from "@/lib/server/data-mongo"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") as ItemStatus | null
  const category = searchParams.get("category") as ItemCategory | null
  const department_id = searchParams.get("department_id")
  const disposition = searchParams.get("disposition") as Disposition | null
  const rows = await listItems({
    status: status || undefined,
    category: category || undefined,
    department_id: department_id ? Number(department_id) : undefined,
    disposition: (disposition as any) || undefined,
  })
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate required fields
    if (!body.name || !body.category || !body.reported_by) {
      return NextResponse.json(
        { error: "Missing required fields: name, category, and reported_by are required" },
        { status: 400 }
      )
    }

    const origin = req.headers.get("x-forwarded-host")
      ? `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host")}`
      : new URL(req.url).origin
    
    // Validate numeric fields to ensure they're not negative
    const validatePositiveNumber = (value: any) => {
      if (value === undefined || value === null || value === "") return undefined
      const num = Number(value)
      return isNaN(num) || num < 0 ? undefined : num
    }

    // Validate string fields to ensure they're not empty strings
    const validateString = (value: any) => {
      if (value === undefined || value === null || value === "") return undefined
      return String(value).trim() || undefined
    }

    // Validate usage pattern
    const validateUsagePattern = (value: any): "Light" | "Moderate" | "Heavy" | undefined => {
      if (value === undefined || value === null || value === "") return undefined
      const validPatterns = ["Light", "Moderate", "Heavy"]
      return validPatterns.includes(value) ? value : undefined
    }

    const currentPrice = validatePositiveNumber(body.current_price)
    const predictedPrice = validatePositiveNumber(body.predicted_price)

    const item = await createItem({
      name: body.name,
      description: body.description,
      category: body.category,
      department_id: Number(body.department_id) || 0,
      reported_by: body.reported_by,
      origin,
      disposition: body.disposition || undefined,
      brand: validateString(body.brand),
      build_quality: validatePositiveNumber(body.build_quality),
      user_lifespan: validatePositiveNumber(body.user_lifespan),
      usage_pattern: validateUsagePattern(body.usage_pattern),
      expiry_years: validatePositiveNumber(body.expiry_years),
      condition: validatePositiveNumber(body.condition),
      original_price: validatePositiveNumber(body.original_price),
      used_duration: validatePositiveNumber(body.used_duration),
      current_price: currentPrice || 0, // User-entered price
      predicted_price: predictedPrice || 0, // ML prediction for reference
      price_confirmed: body.price_confirmed || false,
    })
    return NextResponse.json(item)
  } catch (error) {
    console.error("Error creating item:", error)
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    )
  }
}
