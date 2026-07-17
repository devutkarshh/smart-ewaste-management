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
    console.log("Connecting to MongoDB ...")
    await client.connect()
    const db = client.db(dbName)
    console.log(`Connected. DB="${dbName}"`)

    // SDG Mappings data
    const sdgMappings = [
      {
        _id: "sdg-12-5-diverted",
        sdg: "SDG 12",
        target: "12.5",
        indicator_key: "diverted_kg",
        title: "E-waste Diverted",
        formula_text: "Sum of weight (kg) for items recycled or refurbished",
        unit: "kg",
        preferred_chart: "kpi",
        breakdowns: ["city", "category", "vendor"],
        quality_note: "proxy",
        goal_direction: "up_is_good"
      },
      {
        _id: "sdg-12-5-recycling-rate",
        sdg: "SDG 12",
        target: "12.5",
        indicator_key: "recycling_rate_pct",
        title: "Recycling Rate",
        formula_text: "Recycled weight / Collected weight × 100",
        unit: "%",
        preferred_chart: "line",
        breakdowns: ["city", "vendor"],
        quality_note: "proxy",
        goal_direction: "up_is_good"
      },
      {
        _id: "sdg-12-5-refurb-rate",
        sdg: "SDG 12",
        target: "12.5",
        indicator_key: "refurb_rate_pct",
        title: "Refurbishment Rate",
        formula_text: "Refurbished weight / Collected weight × 100",
        unit: "%",
        preferred_chart: "line",
        breakdowns: ["city", "vendor"],
        quality_note: "proxy",
        goal_direction: "up_is_good"
      },
      {
        _id: "sdg-13-ghg-avoided",
        sdg: "SDG 13",
        target: "13.3",
        indicator_key: "ghg_avoided_kgco2e",
        title: "GHG Emissions Avoided",
        formula_text: "Sum of (weight × emission_factor) for diverted vs landfill baseline",
        unit: "kgCO₂e",
        preferred_chart: "bar",
        breakdowns: ["category", "city"],
        quality_note: "proxy",
        goal_direction: "up_is_good"
      },
      {
        _id: "sdg-12-4-hazardous",
        sdg: "SDG 12",
        target: "12.4",
        indicator_key: "hazardous_processed_count",
        title: "Hazardous Items Safely Processed",
        formula_text: "Count of items with hazardous materials safely recycled or disposed",
        unit: "count",
        preferred_chart: "kpi",
        breakdowns: ["category"],
        quality_note: "proxy",
        goal_direction: "up_is_good"
      },
      {
        _id: "sdg-8-green-jobs",
        sdg: "SDG 8",
        target: "8.5",
        indicator_key: "green_jobs_hours",
        title: "Green Jobs Hours",
        formula_text: "Estimated processing hours for e-waste handling tasks",
        unit: "hours",
        preferred_chart: "line",
        breakdowns: ["vendor"],
        quality_note: "proxy",
        goal_direction: "up_is_good"
      }
    ]

    // Seed SDG mappings
    let sdgCreated = 0
    let sdgSkipped = 0
    for (const mapping of sdgMappings) {
      const exists = await db.collection("sdg_mappings").findOne({ _id: mapping._id })
      if (exists) {
        sdgSkipped++
        continue
      }
      await db.collection("sdg_mappings").insertOne(mapping)
      sdgCreated++
    }
    console.log(`SDG mappings: created=${sdgCreated}, skipped=${sdgSkipped}`)

    // Emission factors data
    const emissionFactors = [
      {
        _id: "ef-laptop",
        category_material: "Laptop",
        kgco2e_per_kg_recycled: 1.2,
        kgco2e_per_kg_refurbished: 0.8,
        kgco2e_per_kg_landfill: 4.5,
        source_note: "WEEE Forum 2019 estimates",
        region: "India"
      },
      {
        _id: "ef-smartphone",
        category_material: "Smartphone",
        kgco2e_per_kg_recycled: 2.1,
        kgco2e_per_kg_refurbished: 1.5,
        kgco2e_per_kg_landfill: 6.2,
        source_note: "WEEE Forum 2019 estimates",
        region: "India"
      },
      {
        _id: "ef-tv",
        category_material: "TV",
        kgco2e_per_kg_recycled: 0.9,
        kgco2e_per_kg_refurbished: 0.6,
        kgco2e_per_kg_landfill: 3.8,
        source_note: "WEEE Forum 2019 estimates",
        region: "India"
      },
      {
        _id: "ef-refrigerator",
        category_material: "Refrigerator",
        kgco2e_per_kg_recycled: 0.7,
        kgco2e_per_kg_refurbished: 0.4,
        kgco2e_per_kg_landfill: 2.9,
        source_note: "WEEE Forum 2019 estimates",
        region: "India"
      },
      {
        _id: "ef-washing-machine",
        category_material: "Washing Machine",
        kgco2e_per_kg_recycled: 0.8,
        kgco2e_per_kg_refurbished: 0.5,
        kgco2e_per_kg_landfill: 3.2,
        source_note: "WEEE Forum 2019 estimates",
        region: "India"
      },
      {
        _id: "ef-air-conditioner",
        category_material: "Air Conditioner",
        kgco2e_per_kg_recycled: 1.0,
        kgco2e_per_kg_refurbished: 0.7,
        kgco2e_per_kg_landfill: 4.1,
        source_note: "WEEE Forum 2019 estimates",
        region: "India"
      },
      {
        _id: "ef-tablet",
        category_material: "Tablet",
        kgco2e_per_kg_recycled: 1.8,
        kgco2e_per_kg_refurbished: 1.2,
        kgco2e_per_kg_landfill: 5.5,
        source_note: "WEEE Forum 2019 estimates",
        region: "India"
      },
      {
        _id: "ef-microwave",
        category_material: "Microwave",
        kgco2e_per_kg_recycled: 0.6,
        kgco2e_per_kg_refurbished: 0.4,
        kgco2e_per_kg_landfill: 2.7,
        source_note: "WEEE Forum 2019 estimates",
        region: "India"
      }
    ]

    // Seed emission factors
    let efCreated = 0
    let efSkipped = 0
    for (const factor of emissionFactors) {
      const exists = await db.collection("emission_factors").findOne({ _id: factor._id })
      if (exists) {
        efSkipped++
        continue
      }
      await db.collection("emission_factors").insertOne(factor)
      efCreated++
    }
    console.log(`Emission factors: created=${efCreated}, skipped=${efSkipped}`)

    // Create some sample transaction data for demonstration
    const sampleTransactions = [
      {
        _id: "trans-001",
        transaction_id: "TXN-001",
        item_id: "item-001",
        type: "collected",
        weight_kg: 2.5,
        timestamp: "2025-08-20T10:00:00Z",
        location: { city: "Mumbai", state: "Maharashtra" },
        vendor_id: "vendor-1"
      },
      {
        _id: "trans-002",
        transaction_id: "TXN-002",
        item_id: "item-001",
        type: "recycled",
        weight_kg: 2.5,
        timestamp: "2025-08-21T14:30:00Z",
        location: { city: "Mumbai", state: "Maharashtra" },
        vendor_id: "vendor-1"
      },
      {
        _id: "trans-003",
        transaction_id: "TXN-003",
        item_id: "item-002",
        type: "collected",
        weight_kg: 1.8,
        timestamp: "2025-08-22T09:15:00Z",
        location: { city: "Delhi", state: "Delhi" },
        vendor_id: "vendor-2"
      },
      {
        _id: "trans-004",
        transaction_id: "TXN-004",
        item_id: "item-002",
        type: "refurbished",
        weight_kg: 1.8,
        timestamp: "2025-08-23T11:45:00Z",
        location: { city: "Delhi", state: "Delhi" },
        vendor_id: "vendor-2"
      }
    ]

    // Seed sample transactions
    let transCreated = 0
    let transSkipped = 0
    for (const transaction of sampleTransactions) {
      const exists = await db.collection("transactions").findOne({ _id: transaction._id })
      if (exists) {
        transSkipped++
        continue
      }
      await db.collection("transactions").insertOne(transaction)
      transCreated++
    }
    console.log(`Sample transactions: created=${transCreated}, skipped=${transSkipped}`)

    console.log("SDG configuration seeding completed successfully!")

  } catch (error) {
    console.error("Error seeding SDG data:", error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

main().catch(console.error)
