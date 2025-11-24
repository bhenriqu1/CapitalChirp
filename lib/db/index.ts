import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Ensure the connection string is properly formatted for Neon
let connectionString = process.env.DATABASE_URL;

// Remove channel_binding if present (can cause issues with serverless driver)
connectionString = connectionString.replace(/[?&]channel_binding=[^&]*/g, "");

// If using pooler endpoint, try to convert to direct connection
// Pooler endpoints can have issues with the serverless driver
// Replace -pooler with direct endpoint if present
if (connectionString.includes("-pooler")) {
  connectionString = connectionString.replace("-pooler", "");
  console.warn("⚠️  Converted pooler to direct connection. For best results, use the direct connection string from Neon dashboard.");
}

// Create the Neon client with HTTP driver (more reliable than serverless)
const sql = neon(connectionString);

export const db = drizzle(sql, { schema });

