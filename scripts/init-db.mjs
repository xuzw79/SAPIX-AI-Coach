import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const schemaPath = path.join(process.cwd(), "db", "schema.sql");
const sql = fs.readFileSync(schemaPath, "utf8");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("railway") ? { rejectUnauthorized: false } : undefined
});

await pool.query(sql);
await pool.end();
console.log("Database initialized.");
