/**
 * Simple script to test database connection
 * Run with: npm run db:test
 */

import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function testConnection() {
  try {
    console.log("🔌 Testing database connection...\n");
    
    // Test 1: Simple query
    const result = await db.execute(sql`SELECT version()`);
    console.log("✅ Connection successful!");
    console.log(`📊 PostgreSQL version: ${result.rows[0]?.version || "unknown"}\n`);
    
    // Test 2: Check if tables exist
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (tables.rows.length > 0) {
      console.log("📋 Existing tables:");
      tables.rows.forEach((row: any) => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log("ℹ️  No tables found yet. Run 'npm run db:push' to create them.");
    }
    
    console.log("\n✅ Database connection test passed!");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Database connection failed!");
    console.error(`Error: ${error.message}\n`);
    
    if (error.message.includes("DATABASE_URL")) {
      console.log("💡 Make sure you have DATABASE_URL set in your .env file");
    } else if (error.message.includes("connection")) {
      console.log("💡 Check that your database connection string is correct");
      console.log("💡 Make sure your Neon project is active (not paused)");
    }
    
    process.exit(1);
  }
}

testConnection();

