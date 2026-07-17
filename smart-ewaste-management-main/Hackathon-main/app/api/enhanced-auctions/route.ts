import { NextRequest, NextResponse } from "next/server"
import { createEnhancedAuction, listEnhancedAuctions } from "@/lib/server/auction-proxy"
import { getSession } from "@/lib/server/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as "active" | "completed" | "cancelled" | null
    const created_by = searchParams.get("created_by")
    const item_id = searchParams.get("item_id")
    
    const filter: any = {}
    if (status) filter.status = status
    if (created_by) filter.created_by = created_by
    if (item_id) filter.item_id = item_id
    
    const auctions = await listEnhancedAuctions(filter)
    return NextResponse.json(auctions)
  } catch (error) {
    console.error("Error fetching enhanced auctions:", error)
    return NextResponse.json({ error: "Failed to fetch auctions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { item_id, starting_price, duration_hours, min_increment } = body
    
    if (!item_id || !starting_price || !duration_hours) {
      return NextResponse.json({ 
        error: "Missing required fields: item_id, starting_price, duration_hours" 
      }, { status: 400 })
    }
    
    if (starting_price < 0 || duration_hours <= 0) {
      return NextResponse.json({ 
        error: "Invalid values: starting_price must be >= 0, duration_hours must be > 0" 
      }, { status: 400 })
    }
    
    const auction = await createEnhancedAuction({
      item_id,
      created_by: session.user.user_id,
      starting_price: Number(starting_price),
      duration_hours: Number(duration_hours),
      min_increment: min_increment ? Number(min_increment) : 50
    })
    
    return NextResponse.json(auction, { status: 201 })
  } catch (error) {
    console.error("Error creating enhanced auction:", error)
    return NextResponse.json({ error: "Failed to create auction" }, { status: 500 })
  }
}
