export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { createUser, getUserByEmail } from "@/lib/server/auth-mongo"
import { getDb } from "@/lib/server/mongo"

// Department mapping for consistent IDs
const DEPARTMENT_MAP: Record<string, number> = {
  "Computer Science": 1,
  "Electrical Engineering": 2,
  "Mechanical Engineering": 3,
  "Civil Engineering": 4,
  "Chemical Engineering": 5,
  "Information Technology": 6,
  "Electronics & Communication": 7,
  "Biotechnology": 8,
  "Mathematics": 9,
  "Physics": 10,
  "Chemistry": 11,
  "Administration": 12,
  "Other": 99
}

export async function POST(req: Request) {
  try {
    const { fullName, email, password, role, department, companyName } = await req.json()
    
    // Validate required fields
    if (!fullName || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate email format
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Check if user already exists
    const existing = await getUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    // Role-specific validation
    if ((role === "student" || role === "coordinator") && !department) {
      return NextResponse.json({ error: "Department is required for students and faculty" }, { status: 400 })
    }

    if (role === "vendor" && !companyName) {
      return NextResponse.json({ error: "Company name is required for vendors" }, { status: 400 })
    }

    let department_id: number | undefined = undefined
    let vendorId = null
    let existingVendor = null

    // Handle department mapping for students and faculty
    if (role === "student" || role === "coordinator") {
      department_id = DEPARTMENT_MAP[department] || 99
    }

    // Handle vendor company creation
    if (role === "vendor" && companyName) {
      const db = await getDb()
      
      // Check if email already exists in vendors collection
      const existingVendorWithEmail = await db.collection("vendors").findOne({ 
        email: email 
      })

      if (existingVendorWithEmail) {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 })
      }

      // Check if company already exists
      existingVendor = await db.collection("vendors").findOne({ 
        company_name: companyName 
      })

      // Always create a new vendor record for each person
      const newVendor = {
        company_name: companyName,
        contact_person: fullName,
        email: email,
        cpcb_registration_no: existingVendor ? 
          existingVendor.cpcb_registration_no : // Use existing CPCB registration if company exists
          `CPCB-${Date.now()}`, // Generate new registration number for new company
        created_at: new Date(),
        status: "active"
      }
      
      const result = await db.collection("vendors").insertOne(newVendor)
      vendorId = result.insertedId
    }

    // Create user account
    await createUser({
      name: fullName,
      email,
      password,
      role,
      department_id,
      vendor_id: vendorId
    })

    return NextResponse.json({ 
      ok: true, 
      message: "Account created successfully",
      ...(role === "vendor" && { 
        vendorCreated: true,
        companyExists: !!existingVendor,
        message: existingVendor ? 
          `Account created successfully! You have been added to ${companyName}.` :
          "Account created successfully! New company registered."
      })
    })

  } catch (e: any) {
    console.error("Signup error:", e)
    return NextResponse.json({ 
      error: e?.message || "Failed to create account. Please try again." 
    }, { status: 500 })
  }
}
