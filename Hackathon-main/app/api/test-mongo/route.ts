export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getDb } from "@/lib/server/mongo"

export async function GET() {
  try {
    console.log('Testing MongoDB connection...')
    const db = await getDb()
    
    // Test basic connection
    const adminDb = db.admin()
    const result = await adminDb.ping()
    console.log('✅ MongoDB connection successful!')
    
    // List collections
    const collections = await db.listCollections().toArray()
    console.log('📋 Available collections:', collections.map(c => c.name))
    
    // Test users collection
    const usersCount = await db.collection('users').countDocuments()
    console.log('👥 Users in database:', usersCount)
    
    // Test sessions collection
    const sessionsCount = await db.collection('sessions').countDocuments()
    console.log('🔐 Sessions in database:', sessionsCount)
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful!',
      ping: result,
      collections: collections.map(c => c.name),
      usersCount,
      sessionsCount
    })
  } catch (error: any) {
    console.error('❌ MongoDB connection failed:', error.message)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
