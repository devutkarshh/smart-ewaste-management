import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || "smart-ewaste"

// Cache the client and the connection promise across hot-reloads and serverless invocations
const globalForMongo = global as unknown as { _mongoClient?: MongoClient; _mongoPromise?: Promise<MongoClient> }

export const mongoClient: MongoClient | undefined = (() => {
  if (!uri) return undefined
  if (!globalForMongo._mongoClient) {
    globalForMongo._mongoClient = new MongoClient(uri)
  }
  return globalForMongo._mongoClient
})()

let connectPromise: Promise<MongoClient> | undefined = (() => {
  if (!uri) return undefined
  if (!globalForMongo._mongoPromise) {
    if (!mongoClient) return undefined
    globalForMongo._mongoPromise = mongoClient.connect()
  }
  return globalForMongo._mongoPromise
})()

export async function getDb() {
  if (!mongoClient) throw new Error("MongoDB not configured: set MONGODB_URI")
  // Always await the (cached) connect promise to ensure an active topology
  if (!connectPromise) {
    connectPromise = mongoClient.connect()
  }
  await connectPromise
  return mongoClient.db(dbName)
}

