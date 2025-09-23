import { NextRequest, NextResponse } from "next/server"
import { getEnhancedAuction } from "@/lib/server/auction-proxy"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auction_id = params.id
    const auction = await getEnhancedAuction(auction_id)
    
    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 })
    }
    
    return NextResponse.json(auction)
  } catch (error) {
    console.error("Error fetching enhanced auction:", error)
    return NextResponse.json({ error: "Failed to fetch auction" }, { status: 500 })
  }
}
