import { neon } from "@neondatabase/serverless"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Create .env.local with DATABASE_URL and try again.")
    process.exit(1)
  }
  const sql = neon(databaseUrl)

  const sqlDir = path.resolve(process.cwd(), "scripts/sql")
  const files = (await readdir(sqlDir))
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b))

  for (const file of files) {
    const full = path.join(sqlDir, file)
    const content = await readFile(full, "utf8")
    console.log(`Applying ${file} ...`)
    // Naively split by semicolon. This is sufficient for our simple seed files.
    const statements = content
      .split(/;\s*(?:\r?\n|$)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"))

    for (const stmt of statements) {
      // Add back the semicolon if needed isn't necessary for execution
      await sql(stmt)
    }
  }
  console.log("Database setup complete.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})