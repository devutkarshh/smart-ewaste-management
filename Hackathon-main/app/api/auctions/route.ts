import { NextRequest, NextResponse } from "next/server"
import { createAuction, listAuctionsWithItemDetails, checkExpiredAuctions } from "@/lib/server/data-mongo"
import { getSession } from "@/lib/server/auth"

export async function GET(request: NextRequest) {
  try {
    // Check for expired auctions on every request
    await checkExpiredAuctions()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as "active" | "completed" | "cancelled" | null
    const created_by = searchParams.get("created_by")
    const item_id = searchParams.get("item_id")
    
    const filter: any = {}
    if (status) filter.status = status
    if (created_by) filter.created_by = created_by
    if (item_id) filter.item_id = item_id
    
    console.log("Fetching auctions with filter:", filter)
    const auctions = await listAuctionsWithItemDetails(filter)
    console.log(`Found ${auctions.length} auctions`)
    if (auctions.length > 0) {
      console.log("Sample auction:", {
        id: auctions[0].id,
        item_id: auctions[0].item_id,
        has_item: !!auctions[0].item,
        item_name: auctions[0].item?.name,
        item_category: auctions[0].item?.category,
        reporter_name: auctions[0].item?.reporter_name
      })
    }
    
    return NextResponse.json(auctions)
  } catch (error) {
    console.error("Error fetching auctions:", error)
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
    const { item_id, starting_price, duration_hours } = body
    
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
    
    const auction = await createAuction({
      item_id,
      created_by: session.user.user_id,
      starting_price: Number(starting_price),
      duration_hours: Number(duration_hours)
    })
    
    return NextResponse.json(auction, { status: 201 })
  } catch (error) {
    console.error("Error creating auction:", error)
    return NextResponse.json({ error: "Failed to create auction" }, { status: 500 })
  }
}
