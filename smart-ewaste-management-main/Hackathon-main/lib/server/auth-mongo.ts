import { getDb } from "./mongo"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { ObjectId } from "mongodb"

export async function createUser({ name, email, password, role, department_id, vendor_id }: { name?: string; email: string; password: string; role?: string; department_id?: number; vendor_id?: any }) {
  const db = await getDb()
  const passwordHash = await bcrypt.hash(password, 12)
  const userData: any = { 
    name: name || email.split("@")[0], 
    email, 
    passwordHash, 
    role: role || "student", 
    department_id: department_id || 0,
    created_at: new Date()
  }
  
  if (vendor_id) {
    userData.vendor_id = vendor_id
  }
  
  await db.collection("users").insertOne(userData)
}

export async function getUserByEmail(email: string) {
  const db = await getDb()
  return db.collection("users").findOne<{ _id: any; name?: string; email: string; passwordHash: string; role?: string; department_id?: number }>({ email })
}

export async function getUserById(id: string) {
  const db = await getDb()
  try {
    return await db.collection("users").findOne<{ _id: any; name?: string; email: string; role?: string; department_id?: number }>({ _id: new ObjectId(id) })
  } catch {
    // Fallback (in case ids were stored as strings)
    return await db.collection("users").findOne<{ _id: any; name?: string; email: string; role?: string; department_id?: number }>({ _id: id as any })
  }
}

export async function createSession(user: any, days = 30) {
  const db = await getDb()
  const id = randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + days * 864e5)
  await db.collection("sessions").insertOne({ _id: id as any, userId: user._id, role: user.role || "student", createdAt: now, expiresAt })
  return { id, user: { user_id: String(user._id), role: user.role || "student", email: user.email } }
}

export async function getSessionById(id: string) {
  const db = await getDb()
  return db.collection("sessions").findOne<{ _id: string; userId: any; role: string; createdAt: Date; expiresAt: Date }>({ _id: id as any })
}

export async function deleteSession(id: string) {
  const db = await getDb()
  await db.collection("sessions").deleteOne({ _id: id as any })
}

