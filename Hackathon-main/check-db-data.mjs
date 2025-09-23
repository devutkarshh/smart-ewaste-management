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

    // Check items
    console.log("\n=== ITEMS ===")
    const items = await db.collection("items").find({}).limit(3).toArray()
    console.log(`Found ${items.length} items`)
    items.forEach((item, i) => {
      console.log(`\nItem ${i + 1}:`)
      console.log(`ID: ${item._id}`)
      console.log(`Name: ${item.name || 'N/A'}`)
      console.log(`Description: ${item.description || 'N/A'}`)
      console.log(`Category: ${item.category || 'N/A'}`)
      console.log(`Brand: ${item.brand || 'N/A'}`)
      console.log(`Condition: ${item.condition || 'N/A'}`)
      console.log(`Usage Pattern: ${item.usage_pattern || 'N/A'}`)
      console.log(`Used Duration: ${item.used_duration || 'N/A'}`)
      console.log(`Original Price: ${item.original_price || 'N/A'}`)
      console.log(`Reported By: ${item.reported_by || 'N/A'}`)
      console.log(`Reported Date: ${item.reported_date || 'N/A'}`)
    })

    // Check auctions
    console.log("\n=== AUCTIONS ===")
    const auctions = await db.collection("auctions").find({}).toArray()
    console.log(`Found ${auctions.length} auctions`)
    auctions.forEach((auction, i) => {
      console.log(`\nAuction ${i + 1}:`)
      console.log(`ID: ${auction._id}`)
      console.log(`Item ID: ${auction.item_id}`)
      console.log(`Starting Price: ${auction.starting_price}`)
      console.log(`Status: ${auction.status}`)
    })

    // Check users
    console.log("\n=== USERS ===")
    const users = await db.collection("users").find({}).limit(3).toArray()
    console.log(`Found ${users.length} users`)
    users.forEach((user, i) => {
      console.log(`\nUser ${i + 1}:`)
      console.log(`ID: ${user._id}`)
      console.log(`Name: ${user.name || 'N/A'}`)
      console.log(`Email: ${user.email || 'N/A'}`)
      console.log(`Role: ${user.role || 'N/A'}`)
    })

  } catch (err) {
    console.error("Error:", err)
    process.exitCode = 1
  } finally {
    try { await client.close() } catch {}
  }
}

main()
