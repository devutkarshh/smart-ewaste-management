import { readFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { MongoClient } from "mongodb"

async function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env")
  if (!existsSync(envPath)) return
  const raw = await readFile(envPath, "utf8")
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

async function main() {
  await loadEnv()

  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB || "smart-ewaste"

  if (!uri) {
    console.error("MONGODB_URI is not set. Add it to .env and try again.")
    process.exit(1)
  }

  const client = new MongoClient(uri)
  try {
    console.log("Connecting to MongoDB...")
    await client.connect()
    const db = client.db(dbName)
    console.log(`Connected. DB="${dbName}"`)

    // Get the items that our auctions are using
    const auctionItems = [
      "a74ab662-e0da-478f-930b-779a8878223f",
      "a77e87a5-4b44-40b8-9526-6aedf2445be0", 
      "43a9c669-5a2d-4fd6-8e67-a9b7bf1d2166"
    ]

    // Update these items with more detailed information
    const itemUpdates = [
      {
        _id: "a74ab662-e0da-478f-930b-779a8878223f",
        updates: {
          brand: "Dell",
          condition: 8,
          usage_pattern: "Moderate",
          used_duration: 2,
          original_price: 50000,
          current_price: 25000,
          build_quality: 9,
          user_lifespan: 5,
          expiry_years: 3
        }
      },
      {
        _id: "a77e87a5-4b44-40b8-9526-6aedf2445be0",
        updates: {
          brand: "HP",
          condition: 6,
          usage_pattern: "Heavy",
          used_duration: 3,
          original_price: 45000,
          current_price: 18000,
          build_quality: 7,
          user_lifespan: 4,
          expiry_years: 2
        }
      },
      {
        _id: "43a9c669-5a2d-4fd6-8e67-a9b7bf1d2166",
        updates: {
          brand: "Lenovo",
          condition: 9,
          usage_pattern: "Light",
          used_duration: 1,
          original_price: 60000,
          current_price: 40000,
          build_quality: 8,
          user_lifespan: 6,
          expiry_years: 5
        }
      }
    ]

    console.log("\nUpdating items with detailed information...")
    let updated = 0
    
    for (const { _id, updates } of itemUpdates) {
      const result = await db.collection("items").updateOne(
        { _id },
        { $set: updates }
      )
      
      if (result.modifiedCount > 0) {
        console.log(`Updated item ${_id} with brand: ${updates.brand}`)
        updated++
      }
    }

    console.log(`\nSuccessfully updated ${updated} items with detailed information`)

    // Verify the updates
    console.log("\nVerifying updated items:")
    for (const itemId of auctionItems) {
      const item = await db.collection("items").findOne({ _id: itemId })
      if (item) {
        console.log(`\nItem ${itemId}:`)
        console.log(`- Name: ${item.name}`)
        console.log(`- Brand: ${item.brand}`)
        console.log(`- Condition: ${item.condition}/10`)
        console.log(`- Usage: ${item.usage_pattern}`)
        console.log(`- Used for: ${item.used_duration} years`)
        console.log(`- Original price: ₹${item.original_price?.toLocaleString()}`)
        console.log(`- Current price: ₹${item.current_price?.toLocaleString()}`)
        console.log(`- Reported by: ${item.reported_by}`)
      }
    }

  } catch (err) {
    console.error("Error:", err)
    process.exitCode = 1
  } finally {
    try { await client.close() } catch {}
  }
}

main()
