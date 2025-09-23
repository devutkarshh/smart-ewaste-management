import { MongoClient } from "mongodb"

// Use environment variables or a fallback for testing
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const dbName = process.env.MONGODB_DB || "smart-ewaste"

async function removeArtificialData() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db(dbName)
    
    // Remove any items with clearly artificial data
    const artificialDataPatterns = {
      // Reset fields that were likely auto-generated
      $unset: {
        brand: "",
        model: "",
        purchase_date: "",
        original_price: "",
        usage_pattern: "",
        issues: "",
        accessories: "",
        storage_capacity: "",
        ram: "",
        processor: ""
      }
    }
    
    console.log('Removing artificial data from items...')
    const result = await db.collection('items').updateMany(
      {
        $or: [
          { brand: { $in: ["Dell", "HP", "Lenovo"] } }, // These might be artificial if they weren't user-entered
          { original_price: { $in: [50000, 45000, 55000] } }, // Round numbers suggest artificial data
          { condition: { $in: [8, 6, 9] } }, // These specific values suggest artificial data
          { usage_pattern: { $in: ["Light", "Heavy", "Moderate"] } } // If these weren't actually entered by users
        ]
      },
      artificialDataPatterns
    )
    
    console.log(`Updated ${result.modifiedCount} items to remove artificial data`)
    
    // Check what real data remains
    console.log('\n=== REMAINING REAL DATA ===')
    const items = await db.collection('items').find({}).toArray()
    
    items.forEach((item, index) => {
      console.log(`\nItem ${index + 1}:`)
      console.log(`Name: ${item.name}`)
      console.log(`Category: ${item.category}`)
      console.log(`Description: ${item.description}`)
      console.log(`Reported by: ${item.reported_by}`)
      console.log(`Has user-filled details:`)
      console.log(`  Brand: ${item.brand || 'NO'}`)
      console.log(`  Model: ${item.model || 'NO'}`)
      console.log(`  Original price: ${item.original_price || 'NO'}`)
      console.log(`  Usage pattern: ${item.usage_pattern || 'NO'}`)
      console.log(`  Issues: ${item.issues || 'NO'}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

removeArtificialData()
