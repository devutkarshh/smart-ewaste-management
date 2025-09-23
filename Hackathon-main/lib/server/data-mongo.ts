import { randomUUID } from "crypto"
import { getDb } from "./mongo"
import { ObjectId } from "mongodb"

export type Role = "student" | "coordinator" | "admin" | "vendor"
export type ItemCategory = "Tablet" | "Microwave" | "Air Conditioner" | "TV" | "Washing Machine" | "Laptop" | "Smartphone" | "Refrigerator"
export type ItemStatus = "Reported" | "Awaiting Pickup" | "Scheduled" | "Collected" | "Recycled" | "Refurbished" | "Safely Disposed"
export type Disposition = "Recyclable" | "Reusable" | "Hazardous" | null

export type Department = { id: number; name: string; location: string }
export type Vendor = { id: string; company_name: string; contact_person: string; email: string; cpcb_registration_no: string }
export type EwasteItem = {
  id: string
  name: string
  description?: string
  category: ItemCategory
  status: ItemStatus
  department_id: number
  reported_by: string
  reported_date: string
  disposed_date?: string | null
  disposition: Disposition
  qr_code_url: string
  brand?: string
  build_quality?: number
  user_lifespan?: number
  usage_pattern?: "Light" | "Moderate" | "Heavy"
  expiry_years?: number
  condition?: number
  original_price?: number
  used_duration?: number
  current_price?: number
  predicted_price?: number
  price_confirmed?: boolean
}
export type Pickup = { 
  id: string; 
  vendor_id: string; 
  admin_id: string; 
  scheduled_date: string; 
  status: "Scheduled" | "Completed" | "Vendor_Accepted" | "Vendor_Rejected";
  vendor_response?: "Accepted" | "Rejected" | null;
  vendor_response_date?: string | null;
  vendor_response_note?: string | null;
}

export type Auction = {
  id: string
  item_id: string
  created_by: string // User who created the auction
  starting_price: number // Minimum bid amount (user price + 50)
  current_highest_bid?: number
  current_highest_bidder?: string // Vendor ID
  status: "active" | "completed" | "cancelled"
  duration_hours: number // Duration in hours
  start_time: string // ISO date string
  end_time: string // ISO date string
  created_at: string
}

export type Bid = {
  id: string
  auction_id: string
  vendor_id: string
  amount: number
  bid_time: string
  status: "active" | "outbid" | "winning"
}

export type Campaign = { id: string; title: string; date: string; description?: string }

// SDG-related types
export type SDGMapping = {
  id: string
  sdg: string // e.g., "SDG 12"
  target: string // e.g., "12.5"
  indicator_key: string // e.g., "recycling_rate_pct"
  title: string
  formula_text: string
  unit: string
  preferred_chart: "line" | "bar" | "kpi"
  breakdowns: string[] // e.g., ["city", "category", "vendor"]
  quality_note: string // e.g., "proxy"
  goal_direction: "up_is_good" | "down_is_good"
}

export type EmissionFactor = {
  id: string
  category_material: string // e.g., "Laptop" or "Battery"
  kgco2e_per_kg_recycled: number
  kgco2e_per_kg_refurbished: number
  kgco2e_per_kg_landfill: number // baseline
  source_note: string
  region: string
}

export type SDGAnalyticsDaily = {
  id: string
  date: string // YYYY-MM-DD (IST)
  kpis: {
    diverted_kg: number
    recycled_kg: number
    collected_kg: number
    refurb_kg: number
    recycling_rate_pct: number
    refurb_rate_pct: number
    ghg_avoided_kgco2e: number
    hazardous_processed_count: number
    green_jobs_hours: number
  }
  breakdowns: {
    by_city: Array<{
      city: string
      diverted_kg: number
      recycling_rate_pct: number
      ghg_avoided_kgco2e: number
    }>
    by_category: Array<{
      category: string
      diverted_kg: number
      ghg_avoided_kgco2e: number
    }>
    by_vendor: Array<{
      vendor: string
      diverted_kg: number
      recycling_rate_pct: number
    }>
  }
  metadata: {
    run_id: string
    input_docs: number
    notes: string
  }
}

export type TransactionType = "collected" | "recycled" | "refurbished" | "disposed"

export type Transaction = {
  id: string
  transaction_id: string
  item_id: string
  type: TransactionType
  weight_kg: number
  timestamp: string
  location: {
    city: string
    state: string
  }
  vendor_id?: string
}

// Helper function for case-insensitive status comparison
export function isStatusEqual(status1: string | undefined, status2: string): boolean {
  return status1?.toLowerCase().trim() === status2.toLowerCase().trim()
}

function mapId<T extends Record<string, any>>(doc: any, extra?: Partial<T>): T {
  if (!doc) return doc
  const { _id, ...rest } = doc
  return { id: String(_id), ...(rest as any), ...(extra || {}) }
}

// Helper function to predict current price
async function predictCurrentPrice(itemData: any): Promise<number> {
  try {
    // If current_price is already provided, use it
    if (itemData.current_price && itemData.current_price > 0) {
      return Math.max(0, Number(itemData.current_price))
    }

    // Basic heuristic calculation for price prediction
    const {
      original_price = 50000,
      used_duration = 2,
      user_lifespan = 5,
      condition = 3,
      build_quality = 3,
      category = "Laptop"
    } = itemData

    // Basic depreciation calculation
    let depreciationRate = 0.15 // 15% per year base rate
    
    // Adjust depreciation based on category
    const categoryMultipliers: Record<string, number> = {
      'Laptop': 0.2,
      'Smartphone': 0.25,
      'Tablet': 0.18,
      'TV': 0.12,
      'Refrigerator': 0.08,
      'Washing Machine': 0.1,
      'Air Conditioner': 0.12,
      'Microwave': 0.15
    }
    
    depreciationRate = categoryMultipliers[category] || 0.15
    
    // Adjust for condition (1-5 scale)
    const conditionMultiplier = Math.max(0.1, condition / 5)
    
    // Adjust for build quality (1-5 scale)
    const qualityMultiplier = Math.max(0.8, 0.8 + (build_quality - 3) * 0.1)
    
    // Calculate depreciated value
    const yearsUsed = Math.min(used_duration, user_lifespan)
    const depreciatedValue = original_price * Math.pow(1 - depreciationRate, yearsUsed)
    
    // Apply condition and quality adjustments
    let currentPrice = depreciatedValue * conditionMultiplier * qualityMultiplier
    
    // Ensure minimum value (5% of original price)
    currentPrice = Math.max(currentPrice, original_price * 0.05)
    
    return Math.round(currentPrice)
  } catch (error) {
    console.error("Error predicting price:", error)
    return 0
  }
}

// Departments
export async function listDepartments(): Promise<Department[]> {
  const db = await getDb()
  const rows = await db.collection("departments").find({}).project({ _id: 1, name: 1, location: 1 }).toArray()
  return rows.map((d: any) => ({ id: typeof d._id === "number" ? d._id : Number(d._id), name: d.name, location: d.location }))
}

// Vendors
export async function listVendors(): Promise<Vendor[]> {
  const db = await getDb()
  const rows = await db.collection("vendors").find({}).project({ _id: 1, company_name: 1, contact_person: 1, email: 1, cpcb_registration_no: 1 }).toArray()
  return rows.map((v: any) => ({ id: String(v._id), company_name: v.company_name, contact_person: v.contact_person, email: v.email, cpcb_registration_no: v.cpcb_registration_no }))
}

export async function getVendorById(vendorId: string): Promise<Vendor | null> {
  const db = await getDb()
  const { ObjectId } = require("mongodb")

  try {
    console.log("Looking for vendor with ID:", vendorId)
    
    // Create multiple query options to handle different ID formats
    const queries = []
    
    // 1. Direct string match (for IDs like "vendor-1")
    queries.push({ _id: vendorId })
    
    // 2. ObjectId conversion (for hex string IDs)
    try {
      if (ObjectId.isValid(vendorId)) {
        queries.push({ _id: new ObjectId(vendorId) })
      }
    } catch (e) {
      // Ignore ObjectId conversion errors
    }
    
    // 3. Match against an id field (fallback)
    queries.push({ id: vendorId })

    console.log("Using queries:", queries)
    
    const vendor = await db.collection("vendors").findOne(
      { $or: queries },
      { projection: { _id: 1, company_name: 1, contact_person: 1, email: 1, cpcb_registration_no: 1 } }
    )

    console.log("Found vendor:", vendor)

    if (!vendor) {
      console.log("No vendor found for ID:", vendorId)
      return null
    }

    return {
      id: String(vendor._id || vendor.id),
      company_name: vendor.company_name,
      contact_person: vendor.contact_person,
      email: vendor.email,
      cpcb_registration_no: vendor.cpcb_registration_no
    }
  } catch (error) {
    console.error("Error fetching vendor by ID:", error)
    return null
  }
}

// Items
export async function createItem(input: { 
  name: string; 
  description?: string; 
  category: ItemCategory; 
  department_id: number; 
  reported_by: string; 
  origin: string; 
  disposition?: Disposition;
  brand?: string;
  build_quality?: number;
  user_lifespan?: number;
  usage_pattern?: "Light" | "Moderate" | "Heavy";
  expiry_years?: number;
  condition?: number;
  original_price?: number;
  used_duration?: number;
  current_price?: number;
  predicted_price?: number;
  price_confirmed?: boolean;
}): Promise<EwasteItem> {
  const db = await getDb()
  const id = randomUUID()
  const now = new Date().toISOString()
  const qrUrl = `${input.origin}/item/${id}`
  
  // Predict current price if not provided
  const predictedPrice = await predictCurrentPrice({
    original_price: input.original_price,
    used_duration: input.used_duration,
    user_lifespan: input.user_lifespan,
    condition: input.condition,
    build_quality: input.build_quality,
    category: input.category,
    current_price: input.current_price
  })
  
  // Use provided current_price (user-entered price) or fallback to predicted price
  const finalCurrentPrice = input.current_price !== undefined && input.current_price !== null 
    ? Math.max(0, Number(input.current_price)) 
    : predictedPrice

  const doc = {
    _id: id,
    name: input.name,
    description: input.description || null,
    category: input.category,
    status: "Reported" as ItemStatus,
    department_id: input.department_id,
    reported_by: input.reported_by,
    reported_date: now,
    disposed_date: null,
    disposition: (input.disposition ?? null) as Disposition,
    qr_code_url: qrUrl,
    brand: input.brand || null,
    build_quality: input.build_quality ? Math.max(0, Number(input.build_quality)) : null,
    user_lifespan: input.user_lifespan ? Math.max(0, Number(input.user_lifespan)) : null,
    usage_pattern: input.usage_pattern || null,
    expiry_years: input.expiry_years ? Math.max(0, Number(input.expiry_years)) : null,
    condition: input.condition ? Math.max(0, Number(input.condition)) : null,
    original_price: input.original_price ? Math.max(0, Number(input.original_price)) : null,
    used_duration: input.used_duration ? Math.max(0, Number(input.used_duration)) : null,
    current_price: finalCurrentPrice, // User-entered price
    predicted_price: input.predicted_price ? Math.max(0, Number(input.predicted_price)) : predictedPrice, // ML prediction for reference
    price_confirmed: input.price_confirmed || false,
  }
  await db.collection("items").insertOne(doc as any)
  return mapId<EwasteItem>(doc)
}

export async function listItems(filter?: { status?: ItemStatus; department_id?: number; category?: ItemCategory; disposition?: Disposition }): Promise<EwasteItem[]> {
  const db = await getDb()
  const q: any = {}
  if (filter?.status) q.status = filter.status
  if (filter?.department_id) q.department_id = filter.department_id
  if (filter?.category) q.category = filter.category
  if (typeof filter?.disposition !== "undefined") q.disposition = filter.disposition
  const rows = await db.collection("items").find(q).sort({ reported_date: -1 }).toArray()
  return rows.map((d: any) => mapId<EwasteItem>(d))
}

export async function getItem(id: string): Promise<EwasteItem | null> {
  const db = await getDb()
  const d = await db.collection("items").findOne({ _id: id as any })
  return d ? mapId<EwasteItem>(d) : null
}

export async function updateItem(id: string, changes: Partial<Pick<EwasteItem, "status" | "description" | "category" | "disposed_date" | "disposition">>): Promise<EwasteItem | null> {
  const db = await getDb()
  await db.collection("items").updateOne({ _id: id as any }, { $set: changes })
  const d = await db.collection("items").findOne({ _id: id as any })
  return d ? mapId<EwasteItem>(d) : null
}

// Pickups
export async function schedulePickup(input: { admin_id: string; vendor_id: string; scheduled_date: string; item_ids: string[] }): Promise<Pickup> {
  const db = await getDb()
  const id = randomUUID()
  const pick: Pickup = { 
    id, 
    admin_id: input.admin_id, 
    vendor_id: input.vendor_id, 
    scheduled_date: input.scheduled_date, 
    status: "Scheduled",
    vendor_response: null,
    vendor_response_date: null,
    vendor_response_note: null
  }
  await db.collection("pickups").insertOne({ _id: id as any, ...pick })
  if (input.item_ids?.length) {
    const ops = input.item_ids.map((item_id) => ({ _id: randomUUID() as any, pickup_id: id, item_id }))
    if (ops.length) await db.collection("pickup_items").insertMany(ops as any)
    await db.collection("items").updateMany({ _id: { $in: input.item_ids as any } }, { $set: { status: "Scheduled" } })
  }
  return pick
}

export async function listVendorPickups(vendor_id: string): Promise<Array<{ id: string; scheduled_date: string; status: string; vendor_response?: string | null; vendor_response_note?: string | null; contact_emails: string[]; items: Array<{ id: string; name: string; category: ItemCategory; current_price?: number; original_price?: number; brand?: string; condition?: number; build_quality?: number; usage_pattern?: string; used_duration?: number; user_lifespan?: number; reported_by: string; reporter_email: string; }> }>> {
  console.log("🔍 listVendorPickups called with vendor_id:", vendor_id)
  const db = await getDb()
  const picks = await db.collection("pickups").find({ vendor_id }).sort({ scheduled_date: -1 }).toArray()
  const ids = picks.map((p: any) => String(p._id))
  const linkRows = ids.length ? await db.collection("pickup_items").find({ pickup_id: { $in: ids } }).toArray() : []
  const itemIds = linkRows.map((r: any) => r.item_id)
  const items = itemIds.length ? await db.collection("items").find({ _id: { $in: itemIds } }).project({ 
    _id: 1, 
    name: 1, 
    category: 1, 
    current_price: 1, 
    original_price: 1, 
    brand: 1, 
    condition: 1, 
    build_quality: 1, 
    usage_pattern: 1, 
    used_duration: 1, 
    user_lifespan: 1,
    reported_by: 1
  }).toArray() : []
  
  // DEBUG: Log sample item data
  if (items.length > 0) {
    console.log("Sample item data:", {
      id: items[0]._id,
      name: items[0].name,
      reported_by: items[0].reported_by,
      reported_by_type: typeof items[0].reported_by
    })
  }
  
  // Get unique reported_by user IDs to fetch their email addresses
  const reporterIds = [...new Set(items.map((item: any) => item.reported_by))]
  console.log("Reporter IDs to lookup:", reporterIds)
  
  // Try to find users - handle both string and ObjectId formats
  let reporters: any[] = []
  if (reporterIds.length > 0) {
    try {
      // Try multiple approaches to find the users
      
      // Approach 1: Try as ObjectIds
      const objectIds = reporterIds.map(id => {
        try {
          return new ObjectId(String(id))
        } catch {
          return null
        }
      }).filter(Boolean) as ObjectId[]
      
      if (objectIds.length > 0) {
        reporters = await db.collection("users").find({ 
          _id: { $in: objectIds } 
        }).project({ _id: 1, email: 1, name: 1 }).toArray()
        console.log("Found reporters by ObjectId:", reporters.length)
      }
      
      // Approach 2: If no results, try as strings
      if (reporters.length === 0) {
        reporters = await db.collection("users").find({ 
          _id: { $in: reporterIds as any } 
        }).project({ _id: 1, email: 1, name: 1 }).toArray()
        console.log("Found reporters by string ID:", reporters.length)
      }
      
      // Approach 3: If still no results, try looking up by email field if reported_by contains emails
      if (reporters.length === 0) {
        const emailLookingIds = reporterIds.filter(id => String(id).includes('@'))
        if (emailLookingIds.length > 0) {
          reporters = await db.collection("users").find({ 
            email: { $in: emailLookingIds } 
          }).project({ _id: 1, email: 1, name: 1 }).toArray()
          console.log("Found reporters by email:", reporters.length)
        }
      }
      
      // Approach 4: If still no results, get all users and log them for debugging
      if (reporters.length === 0) {
        const allUsers = await db.collection("users").find({}).limit(5).project({ _id: 1, email: 1, name: 1 }).toArray()
        console.log("Sample users in database:", allUsers.map(u => ({ id: String(u._id), email: u.email, name: u.name })))
        console.log("Trying to match these reported_by IDs:", reporterIds)
        
        // Try a broad match to see if any user ID contains part of the reported_by
        for (const reporterId of reporterIds) {
          const userMatch = allUsers.find(u => String(u._id).includes(String(reporterId)) || String(reporterId).includes(String(u._id)))
          if (userMatch) {
            reporters.push(userMatch)
            console.log("Found partial match:", { reporterId, userMatch: { id: String(userMatch._id), email: userMatch.email } })
          }
        }
      }
      
    } catch (error) {
      console.log("Error fetching reporters:", error)
    }
  }
  
  console.log("Found reporters:", reporters.map(r => ({ id: r._id, email: r.email })))
  
  const reporterEmailMap = new Map(reporters.map((user: any) => [String(user._id), user.email]))
  console.log("Reporter email mapping:", Array.from(reporterEmailMap.entries()))
  
  const itemMap = new Map(items.map((it: any) => [String(it._id), { 
    id: String(it._id), 
    name: it.name, 
    category: it.category,
    current_price: it.current_price,
    original_price: it.original_price,
    brand: it.brand,
    condition: it.condition,
    build_quality: it.build_quality,
    usage_pattern: it.usage_pattern,
    used_duration: it.used_duration,
    user_lifespan: it.user_lifespan,
    reported_by: String(it.reported_by),
    reporter_email: reporterEmailMap.get(String(it.reported_by)) || "Unknown"
  }]))
  
  return picks.map((p: any) => {
    const pickupItems = linkRows.filter((r: any) => String(r.pickup_id) === String(p._id)).map((r: any) => itemMap.get(String(r.item_id))).filter(Boolean) as any
    const contactEmails = [...new Set(pickupItems.map((item: any) => reporterEmailMap.get(item.reported_by)).filter(Boolean))] as string[]
    
    return {
      id: String(p._id),
      scheduled_date: p.scheduled_date,
      status: p.status,
      vendor_response: p.vendor_response,
      vendor_response_note: p.vendor_response_note,
      contact_emails: contactEmails,
      items: pickupItems,
    }
  })
}

// Auction Management Functions
export async function createAuction(input: {
  item_id: string;
  created_by: string;
  starting_price: number;
  duration_hours: number;
}): Promise<Auction> {
  const db = await getDb()
  const id = randomUUID()
  const created_at = new Date().toISOString()
  const start_time = created_at
  const end_time = new Date(Date.now() + input.duration_hours * 60 * 60 * 1000).toISOString()
  
  const auction: Auction = {
    id,
    item_id: input.item_id,
    created_by: input.created_by,
    starting_price: input.starting_price,
    current_highest_bid: undefined,
    current_highest_bidder: undefined,
    duration_hours: input.duration_hours,
    start_time,
    end_time,
    created_at,
    status: "active"
  }
  
  await db.collection("auctions").insertOne({ _id: id as any, ...auction })
  return auction
}

export async function listAuctions(filter?: { 
  status?: "active" | "completed" | "cancelled"; 
  created_by?: string;
  item_id?: string;
}): Promise<Auction[]> {
  const db = await getDb()
  const query: any = {}
  
  // Case-insensitive status filtering
  if (filter?.status) {
    query.status = { $regex: new RegExp(`^${filter.status}$`, 'i') }
  }
  if (filter?.created_by) query.created_by = filter.created_by
  if (filter?.item_id) query.item_id = filter.item_id
  
  const auctions = await db.collection("auctions").find(query).sort({ created_at: -1 }).toArray()
  return auctions.map(a => {
    const { _id, ...rest } = a
    return { id: String(_id), ...rest } as Auction
  })
}

export async function listAuctionsWithItemDetails(filter?: { 
  status?: "active" | "completed" | "cancelled"; 
  created_by?: string;
  item_id?: string;
}): Promise<Array<Auction & { 
  item?: EwasteItem & { reporter_name?: string; reporter_email?: string; reporter_role?: string };
}>> {
  const db = await getDb()
  const query: any = {}
  
  console.log("listAuctionsWithItemDetails called with filter:", filter)
  
  // Case-insensitive status filtering
  if (filter?.status) {
    query.status = { $regex: new RegExp(`^${filter.status}$`, 'i') }
  }
  if (filter?.created_by) query.created_by = filter.created_by
  if (filter?.item_id) query.item_id = filter.item_id
  
  console.log("MongoDB query:", query)
  const auctions = await db.collection("auctions").find(query).sort({ created_at: -1 }).toArray()
  console.log(`Found ${auctions.length} auctions from database`)
  
  // Get all unique item IDs
  const itemIds = [...new Set(auctions.map(a => a.item_id))]
  console.log("Item IDs to fetch:", itemIds)
  
  // Fetch all items for these auctions
  const items = await db.collection("items").find({ 
    _id: { $in: itemIds } 
  }).toArray()
  console.log(`Found ${items.length} items for auctions`)
  
  // Create item lookup map
  const itemMap = new Map<string, any>()
  items.forEach(item => {
    const itemWithId = mapId<EwasteItem>(item)
    itemMap.set(String(item._id), itemWithId)
    console.log(`Mapped item ${String(item._id)}: ${itemWithId.name} (${itemWithId.category})`)
  })
  
  // Get unique reporter IDs from items
  const reporterIds = [...new Set(items.map(item => item.reported_by).filter(Boolean))]
  console.log("Reporter IDs to fetch:", reporterIds)
  
  // Fetch reporter details (prioritize email lookup)
  let reporters: any[] = []
  if (reporterIds.length > 0) {
    try {
      // First try email lookup (since reported_by fields contain emails)
      const emailIds = reporterIds.filter(id => String(id).includes('@'))
      if (emailIds.length > 0) {
        reporters = await db.collection("users").find({ 
          email: { $in: emailIds } 
        }).project({ _id: 1, email: 1, name: 1, role: 1 }).toArray()
        console.log(`Found ${reporters.length} reporters via email lookup`)
      }
      
      // For any remaining IDs that might be ObjectIds
      const remainingIds = reporterIds.filter(id => !String(id).includes('@'))
      if (remainingIds.length > 0 && reporters.length < reporterIds.length) {
        const objectIds = remainingIds.map(id => {
          try {
            return new ObjectId(String(id))
          } catch {
            return null
          }
        }).filter(Boolean) as ObjectId[]
        
        if (objectIds.length > 0) {
          const objectIdReporters = await db.collection("users").find({ 
            _id: { $in: objectIds } 
          }).project({ _id: 1, email: 1, name: 1, role: 1 }).toArray()
          reporters = [...reporters, ...objectIdReporters]
        }
      }
    } catch (error) {
      console.log("Error fetching reporters:", error)
    }
  }
  
  // Create reporter lookup map
  const reporterMap = new Map<string, any>()
  reporters.forEach(reporter => {
    const id = String(reporter._id)
    reporterMap.set(id, reporter)
    reporterMap.set(reporter.email, reporter) // Also map by email for fallback
  })
  console.log(`Found ${reporters.length} reporters, created ${reporterMap.size} reporter mappings`)
  
  // Combine auction data with item details and reporter info
  const results = auctions.map(a => {
    const { _id, ...rest } = a
    const auction = { id: String(_id), ...rest } as Auction
    const item = itemMap.get(a.item_id)
    
    console.log(`Processing auction ${String(_id)}, item_id: ${a.item_id}, found item: ${!!item}`)
    
    if (item && item.reported_by) {
      const reporter = reporterMap.get(String(item.reported_by)) || reporterMap.get(item.reported_by)
      console.log(`Item reported_by: ${item.reported_by}, found reporter: ${!!reporter}`)
      if (reporter) {
        item.reporter_name = reporter.name
        item.reporter_email = reporter.email
        item.reporter_role = reporter.role
        console.log(`Added reporter info: ${reporter.name} (${reporter.role})`)
      }
    }
    
    return {
      ...auction,
      item
    }
  })
  
  console.log(`Returning ${results.length} auctions with item details`)
  return results
}

export async function getAuction(id: string): Promise<Auction | null> {
  const db = await getDb()
  const auction = await db.collection("auctions").findOne({ _id: id as any })
  if (!auction) return null
  
  const { _id, ...rest } = auction
  return { id: String(_id), ...rest } as Auction
}

export async function placeBid(input: {
  auction_id: string;
  vendor_id: string;
  amount: number;
}): Promise<Bid> {
  const db = await getDb()
  const id = randomUUID()
  
  // Check if auction exists and is active
  const auction = await getAuction(input.auction_id)
  if (!auction || !isStatusEqual(auction.status, "active")) {
    throw new Error("Auction is not active")
  }
  
  // Check if auction has expired
  if (new Date() > new Date(auction.end_time)) {
    throw new Error("Auction has expired")
  }
  
  // Check minimum bid requirement (starting price + 50Rs or current highest + 50Rs)
  const minBid = auction.current_highest_bid 
    ? auction.current_highest_bid + 50 
    : auction.starting_price + 50
    
  if (input.amount < minBid) {
    throw new Error(`Bid must be at least ₹${minBid}`)
  }
  
  const bid_time = new Date().toISOString()
  
  const bid: Bid = {
    id,
    auction_id: input.auction_id,
    vendor_id: input.vendor_id,
    amount: input.amount,
    bid_time,
    status: "winning"
  }
  
  // Mark previous highest bid as outbid
  if (auction.current_highest_bidder) {
    await db.collection("bids").updateMany(
      { auction_id: input.auction_id, vendor_id: auction.current_highest_bidder },
      { $set: { status: "outbid" } }
    )
  }
  
  // Insert new bid and update auction's current highest bid
  await db.collection("bids").insertOne({ _id: id as any, ...bid })
  await db.collection("auctions").updateOne(
    { _id: input.auction_id as any },
    { 
      $set: { 
        current_highest_bid: input.amount,
        current_highest_bidder: input.vendor_id
      } 
    }
  )
  
  return bid
}

export async function listBids(auction_id: string): Promise<Bid[]> {
  const db = await getDb()
  const bids = await db.collection("bids").find({ auction_id }).sort({ amount: -1, bid_time: 1 }).toArray()
  return bids.map(b => {
    const { _id, ...rest } = b
    return { id: String(_id), ...rest } as Bid
  })
}

export async function completeAuction(auction_id: string): Promise<boolean> {
  const db = await getDb()
  
  // Get highest bid
  const bids = await listBids(auction_id)
  const winningBid = bids.length > 0 ? bids[0] : null
  
  if (winningBid) {
    // Mark winning bid (should already be marked as winning)
    await db.collection("bids").updateOne(
      { _id: winningBid.id as any },
      { $set: { status: "winning" } }
    )
    
    // Mark other bids as outbid
    await db.collection("bids").updateMany(
      { auction_id, _id: { $ne: winningBid.id as any } },
      { $set: { status: "outbid" } }
    )
  }
  
  // Mark auction as completed
  await db.collection("auctions").updateOne(
    { _id: auction_id as any },
    { $set: { status: "completed" } }
  )
  
  return true
}

export async function checkExpiredAuctions(): Promise<void> {
  const db = await getDb()
  const now = new Date().toISOString()
  
  // Find active auctions that have expired (case-insensitive)
  const expiredAuctions = await db.collection("auctions").find({
    status: { $regex: /^active$/i },
    end_time: { $lt: now }
  }).toArray()
  
  console.log(`🔍 checkExpiredAuctions: found ${expiredAuctions.length} expired auctions`)
  
  // Complete each expired auction
  for (const auction of expiredAuctions) {
    await completeAuction(String(auction._id))
  }
  
  // Also check enhanced auctions
  try {
    const { checkExpiredEnhancedAuctions } = await import('./auction-proxy')
    await checkExpiredEnhancedAuctions()
  } catch (error) {
    console.error("Error checking enhanced auctions:", error)
  }
}

export async function updateVendorResponse(pickup_id: string, vendor_id: string, response: "Accepted" | "Rejected", note?: string): Promise<boolean> {
  const db = await getDb()
  const now = new Date().toISOString()
  const status = response === "Accepted" ? "Vendor_Accepted" : "Vendor_Rejected"
  
  // Update the pickup record
  const result = await db.collection("pickups").updateOne(
    { _id: pickup_id as any, vendor_id },
    { 
      $set: { 
        vendor_response: response,
        vendor_response_date: now,
        vendor_response_note: note || null,
        status: status
      } 
    }
  )
  
  // If vendor rejected the pickup, reset all associated items back to "Reported" status
  if (response === "Rejected" && result.modifiedCount > 0) {
    try {
      // Get all item IDs associated with this pickup
      const pickupItems = await db.collection("pickup_items").find({ pickup_id }).toArray()
      const itemIds = pickupItems.map((pi: any) => pi.item_id)
      
      if (itemIds.length > 0) {
        // Reset items back to "Reported" status so they can be rescheduled
        await db.collection("items").updateMany(
          { _id: { $in: itemIds as any } }, 
          { $set: { status: "Reported" } }
        )
      }
    } catch (error) {
      console.error("Error resetting item status after rejection:", error)
    }
  }
  
  return result.modifiedCount > 0
}

export async function listAdminPickups(): Promise<Array<{ 
  id: string; 
  scheduled_date: string; 
  status: string; 
  vendor_response?: string | null; 
  vendor_response_date?: string | null;
  vendor_response_note?: string | null;
  vendor: { name: string; company: string; email: string; cpcb_registration_no: string };
  items: Array<{ id: string; name: string; category: ItemCategory }> 
}>> {
  const db = await getDb()
  const picks = await db.collection("pickups").find({}).sort({ scheduled_date: -1 }).toArray()
  
  // Get vendor information - try both string and ObjectId conversion for vendor_id
  const vendorIds = [...new Set(picks.map((p: any) => p.vendor_id))]
  let vendors: any[] = []
  
  if (vendorIds.length > 0) {
    // Try ObjectId lookup first
    try {
      const { ObjectId } = await import('mongodb')
      const objectIds = vendorIds.map(id => {
        try {
          return new ObjectId(String(id))
        } catch {
          return id
        }
      })
      
      vendors = await db.collection("vendors").find({ 
        _id: { $in: objectIds as any } 
      }).project({ _id: 1, contact_person: 1, company_name: 1, email: 1, cpcb_registration_no: 1 }).toArray()
      
    } catch (error) {
      console.warn("ObjectId lookup failed, trying string lookup:", error)
      // Fallback to string lookup
      vendors = await db.collection("vendors").find({ 
        _id: { $in: vendorIds as any } 
      }).project({ _id: 1, contact_person: 1, company_name: 1, email: 1, cpcb_registration_no: 1 }).toArray()
    }
  }
  
  const vendorMap = new Map(vendors.map((v: any) => [String(v._id), { 
    name: v.contact_person || "Unknown", 
    company: v.company_name || "Unknown", 
    email: v.email || "Unknown",
    cpcb_registration_no: v.cpcb_registration_no || "Not Available"
  }]))
  
  // Get pickup items
  const pickupIds = picks.map((p: any) => String(p._id))
  const linkRows = pickupIds.length ? await db.collection("pickup_items").find({ pickup_id: { $in: pickupIds } }).toArray() : []
  const itemIds = linkRows.map((r: any) => r.item_id)
  const items = itemIds.length ? await db.collection("items").find({ _id: { $in: itemIds } }).project({ _id: 1, name: 1, category: 1 }).toArray() : []
  const itemMap = new Map(items.map((it: any) => [String(it._id), { 
    id: String(it._id), 
    name: it.name, 
    category: it.category 
  }]))
  
  return picks.map((p: any) => ({
    id: String(p._id),
    scheduled_date: p.scheduled_date,
    status: p.status,
    vendor_response: p.vendor_response,
    vendor_response_date: p.vendor_response_date,
    vendor_response_note: p.vendor_response_note,
    vendor: vendorMap.get(String(p.vendor_id)) || { name: "Unknown", company: "Unknown", email: "Unknown", cpcb_registration_no: "Not Available" },
    items: linkRows.filter((r: any) => String(r.pickup_id) === String(p._id)).map((r: any) => itemMap.get(String(r.item_id))).filter(Boolean) as any,
  }))
}

// Campaigns
export async function listCampaigns(): Promise<Campaign[]> {
  const db = await getDb()
  const rows = await db.collection("campaigns").find({}).sort({ date: -1 }).toArray()
  return rows.map((d: any) => mapId<Campaign>(d))
}

export async function createCampaign(input: { title: string; date: string; description?: string }): Promise<Campaign> {
  const db = await getDb()
  const id = randomUUID()
  const doc = { _id: id, title: input.title, date: input.date, description: input.description || null }
  await db.collection("campaigns").insertOne(doc as any)
  return mapId<Campaign>(doc)
}

// Analytics
export async function analyticsVolumeTrends(): Promise<{ month: string; count: number }[]> {
  const items = await listItems()
  const map = new Map<string, number>()
  for (const it of items) {
    const m = it.reported_date.slice(0, 7)
    map.set(m, (map.get(m) || 0) + 1)
  }
  return Array.from(map.entries()).sort((a, b) => (a[0] > b[0] ? 1 : -1)).map(([month, count]) => ({ month, count }))
}

export async function analyticsCategoryDistribution(): Promise<{ category: ItemCategory; count: number }[]> {
  const items = await listItems()
  const map = new Map<ItemCategory, number>()
  for (const it of items) map.set(it.category, (map.get(it.category) || 0) + 1)
  return Array.from(map.entries()).map(([category, count]) => ({ category, count }))
}

export async function analyticsRecoveryRate(): Promise<{ rate: number; recycled: number; disposed: number }> {
  const items = await listItems()
  const recycled = items.filter((i) => i.status === "Recycled").length
  const refurbished = items.filter((i) => i.status === "Refurbished").length
  const safelyDisposed = items.filter((i) => i.status === "Safely Disposed").length
  const disposed = recycled + refurbished + safelyDisposed
  const total = items.length
  const rate = total ? Math.round(((disposed / total) * 100 + Number.EPSILON) * 100) / 100 : 0
  return { rate, recycled, disposed }
}

// SDG Analytics Functions
export async function getSDGMappings(): Promise<SDGMapping[]> {
  const db = await getDb()
  const rows = await db.collection("sdg_mappings").find({}).sort({ sdg: 1, target: 1 }).toArray()
  return rows.map((d: any) => mapId<SDGMapping>(d))
}

export async function createSDGMapping(input: Omit<SDGMapping, 'id'>): Promise<SDGMapping> {
  const db = await getDb()
  const id = randomUUID()
  const doc = { _id: id as any, ...input }
  await db.collection("sdg_mappings").insertOne(doc)
  return mapId<SDGMapping>(doc)
}

export async function getEmissionFactors(): Promise<EmissionFactor[]> {
  const db = await getDb()
  const rows = await db.collection("emission_factors").find({}).sort({ category_material: 1 }).toArray()
  return rows.map((d: any) => mapId<EmissionFactor>(d))
}

export async function createEmissionFactor(input: Omit<EmissionFactor, 'id'>): Promise<EmissionFactor> {
  const db = await getDb()
  const id = randomUUID()
  const doc = { _id: id as any, ...input }
  await db.collection("emission_factors").insertOne(doc)
  return mapId<EmissionFactor>(doc)
}

export async function getSDGAnalyticsDailyRange(startDate: string, endDate: string): Promise<SDGAnalyticsDaily[]> {
  const db = await getDb()
  const rows = await db.collection("sdg_analytics_daily")
    .find({ 
      date: { 
        $gte: startDate, 
        $lte: endDate 
      } 
    })
    .sort({ date: 1 })
    .toArray()
  return rows.map((d: any) => mapId<SDGAnalyticsDaily>(d))
}

export async function createTransaction(input: Omit<Transaction, 'id'>): Promise<Transaction> {
  const db = await getDb()
  const id = randomUUID()
  const doc = { _id: id as any, ...input }
  await db.collection("transactions").insertOne(doc)
  return mapId<Transaction>(doc)
}

export async function getTransactionsInRange(startDate: string, endDate: string): Promise<Transaction[]> {
  const db = await getDb()
  const rows = await db.collection("transactions")
    .find({ 
      timestamp: { 
        $gte: startDate, 
        $lte: endDate 
      } 
    })
    .sort({ timestamp: 1 })
    .toArray()
  return rows.map((d: any) => mapId<Transaction>(d))
}

// Helper function to calculate SDG metrics from raw data
export async function calculateSDGMetrics(startDate: string, endDate: string): Promise<{
  diverted_kg: number
  recycled_kg: number
  collected_kg: number
  refurb_kg: number
  recycling_rate_pct: number
  refurb_rate_pct: number
  ghg_avoided_kgco2e: number
  hazardous_processed_count: number
  green_jobs_hours: number
}> {
  const transactions = await getTransactionsInRange(startDate, endDate)
  const emissionFactors = await getEmissionFactors()
  
  // Calculate basic metrics
  const collected_kg = transactions
    .filter(t => t.type === "collected")
    .reduce((sum, t) => sum + t.weight_kg, 0)
  
  const recycled_kg = transactions
    .filter(t => t.type === "recycled")
    .reduce((sum, t) => sum + t.weight_kg, 0)
  
  const refurb_kg = transactions
    .filter(t => t.type === "refurbished")
    .reduce((sum, t) => sum + t.weight_kg, 0)
  
  const diverted_kg = recycled_kg + refurb_kg
  
  const recycling_rate_pct = collected_kg > 0 ? (recycled_kg / collected_kg) * 100 : 0
  const refurb_rate_pct = collected_kg > 0 ? (refurb_kg / collected_kg) * 100 : 0
  
  // Calculate GHG avoided (simplified - would need item categories)
  const ghg_avoided_kgco2e = diverted_kg * 2.5 // Placeholder factor
  
  // Count hazardous items processed (simplified)
  const hazardous_processed_count = transactions
    .filter(t => ["recycled", "disposed"].includes(t.type))
    .length // Placeholder - would need to check item materials
  
  // Estimate green jobs hours (simplified)
  const green_jobs_hours = diverted_kg * 0.5 // Placeholder: 0.5 hours per kg processed
  
  return {
    diverted_kg: Math.round(diverted_kg * 100) / 100,
    recycled_kg: Math.round(recycled_kg * 100) / 100,
    collected_kg: Math.round(collected_kg * 100) / 100,
    refurb_kg: Math.round(refurb_kg * 100) / 100,
    recycling_rate_pct: Math.round(recycling_rate_pct * 100) / 100,
    refurb_rate_pct: Math.round(refurb_rate_pct * 100) / 100,
    ghg_avoided_kgco2e: Math.round(ghg_avoided_kgco2e * 100) / 100,
    hazardous_processed_count,
    green_jobs_hours: Math.round(green_jobs_hours * 100) / 100
  }
}

