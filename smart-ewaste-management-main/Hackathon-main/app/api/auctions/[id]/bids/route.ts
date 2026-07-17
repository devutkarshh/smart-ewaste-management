import { NextRequest, NextResponse } from "next/server"
import { placeBid, listBids } from "@/lib/server/data-mongo"
import { getSession } from "@/lib/server/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auction_id = params.id
    const bids = await listBids(auction_id)
    return NextResponse.json(bids)
  } catch (error) {
    console.error("Error fetching bids:", error)
    return NextResponse.json({ error: "Failed to fetch bids" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session?.user?.user_id || session.user.role !== "vendor") {
      return NextResponse.json({ error: "Unauthorized - vendors only" }, { status: 401 })
    }
    
    const auction_id = params.id
    const body = await request.json()
    const { amount } = body
    
    if (!amount || amount <= 0) {
      return NextResponse.json({ 
        error: "Invalid amount - must be greater than 0" 
      }, { status: 400 })
    }
    
    const bid = await placeBid({
      auction_id,
      vendor_id: session.user.user_id,
      amount: Number(amount)
    })
    
    return NextResponse.json(bid, { status: 201 })
  } catch (error) {
    console.error("Error placing bid:", error)
    const message = error instanceof Error ? error.message : "Failed to place bid"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
