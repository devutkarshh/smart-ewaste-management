import { checkExpiredEnhancedAuctions } from "@/lib/server/auction-proxy"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🕐 Running expired enhanced auctions check...")
    await checkExpiredEnhancedAuctions()
    
    return NextResponse.json({ 
      success: true, 
      message: "Expired auctions check completed",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error checking expired enhanced auctions:", error)
    return NextResponse.json({ 
      error: "Failed to check expired auctions" 
    }, { status: 500 })
  }
}
