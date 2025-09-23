// Debug endpoint to check transaction data
import { NextRequest, NextResponse } from "next/server"
import { getTransactionsInRange } from "@/lib/server/data-mongo"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate") || "2024-01-01"
    const endDate = searchParams.get("endDate") || "2024-12-31"

    console.log(`Debug: Fetching transactions from ${startDate} to ${endDate}`)
    
    const transactions = await getTransactionsInRange(startDate, endDate)
    
    console.log(`Debug: Found ${transactions.length} transactions`)
    
    return NextResponse.json({
      count: transactions.length,
      dateRange: { startDate, endDate },
      transactions: transactions.slice(0, 5), // Show first 5 for debugging
      sampleData: transactions.length > 0 ? {
        firstTransaction: transactions[0],
        lastTransaction: transactions[transactions.length - 1]
      } : null
    })
  } catch (error) {
    console.error("Debug transactions error:", error)
    return NextResponse.json(
      { error: "Failed to fetch transactions", details: error },
      { status: 500 }
    )
  }
}
