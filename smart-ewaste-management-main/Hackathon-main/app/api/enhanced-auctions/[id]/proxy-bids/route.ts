import { NextRequest, NextResponse } from "next/server"
import { processProxyBid, listProxyBids } from "@/lib/server/auction-proxy"
import { getSession } from "@/lib/server/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auction_id = params.id
    const bids = await listProxyBids(auction_id)
    return NextResponse.json(bids)
  } catch (error) {
    console.error("Error fetching proxy bids:", error)
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
    const { max_proxy_bid } = body
    
    if (!max_proxy_bid || max_proxy_bid <= 0) {
      return NextResponse.json({ 
        error: "Invalid max_proxy_bid - must be greater than 0" 
      }, { status: 400 })
    }
    
    const bid = await processProxyBid(
      auction_id,
      session.user.user_id,
      Number(max_proxy_bid)
    )
    
    return NextResponse.json(bid, { status: 201 })
  } catch (error) {
    console.error("Error processing proxy bid:", error)
    const message = error instanceof Error ? error.message : "Failed to place bid"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
