import { MongoClient } from "mongodb"

async function fixAuctionStatuses() {
  try {
    // Use the same connection as the app
    const uri = 'mongodb+srv://princesengupta166:mapraftel166@cluster0.eforz7s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    const dbName = 'smart-ewaste'
    
    console.log('🔗 Connecting to MongoDB...')
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db(dbName)
    
    console.log('🔧 Fixing auction status casing...')
    
    // Fix "Cancelled" to "cancelled"
    const cancelledResult = await db.collection('auctions').updateMany(
      { status: "Cancelled" },
      { $set: { status: "cancelled" } }
    )
    console.log(`Fixed ${cancelledResult.modifiedCount} "Cancelled" → "cancelled" auctions`)
    
    // Fix "Active" to "active"
    const activeResult = await db.collection('auctions').updateMany(
      { status: "Active" },
      { $set: { status: "active" } }
    )
    console.log(`Fixed ${activeResult.modifiedCount} "Active" → "active" auctions`)
    
    // Fix "Completed" to "completed"
    const completedResult = await db.collection('auctions').updateMany(
      { status: "Completed" },
      { $set: { status: "completed" } }
    )
    console.log(`Fixed ${completedResult.modifiedCount} "Completed" → "completed" auctions`)
    
    // Fix any other potential variations
    const otherVariations = [
      "ACTIVE", "COMPLETED", "CANCELLED",
      "Active ", " active", " Active ", // with spaces
      "Completed ", " completed", " Completed ",
      "Cancelled ", " cancelled", " Cancelled "
    ]
    
    for (const variation of otherVariations) {
      const target = variation.toLowerCase().trim()
      const result = await db.collection('auctions').updateMany(
        { status: variation },
        { $set: { status: target } }
      )
      if (result.modifiedCount > 0) {
        console.log(`Fixed ${result.modifiedCount} "${variation}" → "${target}" auctions`)
      }
    }
    
    // Show current status distribution
    const statuses = await db.collection('auctions').aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]).toArray()
    
    console.log('\n📊 Current status distribution:')
    statuses.forEach(s => console.log(`  ${s._id}: ${s.count}`))
    
    await client.close()
    console.log('\n✅ Status normalization complete')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error fixing statuses:', error)
    process.exit(1)
  }
}

fixAuctionStatuses()

fixAuctionStatuses()
