import { readFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import bcrypt from "bcryptjs"
import { MongoClient } from "mongodb"

async function loadEnv() {
  // Load .env.local (Next.js style) for Node script
  const envPath = path.resolve(process.cwd(), ".env.local")
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
    console.error("MONGODB_URI is not set. Add it to .env.local and try again.")
    process.exit(1)
  }

  const client = new MongoClient(uri)
  try {
    console.log("Connecting to MongoDB ...")
    await client.connect()
    const db = client.db(dbName)
    console.log(`Connected. DB="${dbName}"`)

    // Ensure unique index on email
    try {
      await db.collection("users").createIndex({ email: 1 }, { unique: true })
    } catch {}

    // Seed Departments (idempotent by name)
    try {
      const deptNames = [
        "CSE",
        "CSE(AI&ML)",
        "IT",
        "IOT",
        "MECH",
        "CIVIL",
        "AEIE",
        "CSE(DS)",
      ]
      const deptCol = db.collection("departments")
      const existing = await deptCol.find({}).project({ _id: 1, name: 1 }).toArray()
      const existingNames = new Set(existing.map((d) => String(d.name || "").toLowerCase()))
      let nextId = existing.reduce((max, d) => (typeof d._id === "number" && d._id > max ? d._id : max), 0)
      let createdDepts = 0
      let skippedDepts = 0
      for (const name of deptNames) {
        if (existingNames.has(name.toLowerCase())) {
          skippedDepts++
          continue
        }
        nextId += 1
        await deptCol.insertOne({ _id: nextId, name, location: "" })
        createdDepts++
      }
      console.log(`Departments: created=${createdDepts}, skipped=${skippedDepts}`)
    } catch (e) {
      console.warn("Department seed step failed:", e)
    }

    // Vendors array
    const vendors = [
      { id: 1, name: "Vendor One", email: "vendor1@example.com", password: "vendor123", role: "vendor", department_id: 0, company_name: "EcoTech Solutions", contact_person: "John Doe", cpcb_registration_no: "CPCB-12345" },
      { id: 2, name: "Vendor Two", email: "vendor2@example.com", password: "vendor456", role: "vendor", department_id: 0, company_name: "GreenCycle Ltd.", contact_person: "Jane Smith", cpcb_registration_no: "CPCB-67890" },
      // Add more vendors as needed
    ]

    // Seed vendors collection
    let vendorsCreated = 0
    let vendorsSkipped = 0
    for (const v of vendors) {
      const exists = await db.collection("vendors").findOne({ email: v.email })
      if (exists) {
        vendorsSkipped++
        continue
      }
      await db.collection("vendors").insertOne({
        _id: `vendor-${v.id}`,
        company_name: v.company_name,
        contact_person: v.contact_person,
        email: v.email,
        cpcb_registration_no: v.cpcb_registration_no,
      })
      vendorsCreated++
    }
    console.log(`Vendors collection: created=${vendorsCreated}, skipped=${vendorsSkipped}`)

    // Users array (add vendors here)
    const users = [
      { name: "Admin User", email: "admin@example.com", password: "admin123", role: "admin", department_id: 0 },
      ...vendors,
      { name: "Student One", email: "student1@example.com", password: "student123", role: "student", department_id: 0 },
      { name: "Faculty One", email: "faculty1@example.com", password: "faculty123", role: "coordinator", department_id: 0 },
    ]

    let created = 0
    let skipped = 0

    for (const u of users) {
      const exists = await db.collection("users").findOne({ email: u.email })
      if (exists) {
        console.log(`Skipping existing: ${u.email}`)
        skipped++
        continue
      }
      const passwordHash = await bcrypt.hash(u.password, 12)
      const userDoc = {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        department_id: u.department_id,
      }
      if (u.role === "vendor" && u.company_name) {
        userDoc.company_name = u.company_name
        userDoc.vendor_id = `vendor-${u.id}`
      }
      await db.collection("users").insertOne(userDoc)
      console.log(`Created: ${u.email}`)
      created++
    }

    console.log("Seed complete.", { created, skipped })
    console.log("You can now login with:")
    console.log(" - Admin:    admin@example.com / admin123")
    console.log(" - Vendor:   vendor1@example.com / vendor123")
    console.log(" - Student:  student1@example.com / student123")
    console.log(" - Faculty:  faculty1@example.com / faculty123")
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  } finally {
    try { await client.close() } catch {}
  }
}

main()