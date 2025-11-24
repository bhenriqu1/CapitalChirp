/**
 * Check if database tables exist
 */
import * as dotenv from "dotenv";
dotenv.config();

import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function checkTables() {
  try {
    console.log("🔍 Checking database tables...\n");
    
    // Check if users table exists
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log("📋 Tables found:");
    if (tables.rows.length === 0) {
      console.log("   ❌ No tables found! You need to run: npm run db:push");
    } else {
      tables.rows.forEach((row: any) => {
        console.log(`   ✅ ${row.table_name}`);
      });
    }
    
    // Check users table specifically
    const usersTable = tables.rows.find((row: any) => row.table_name === "users");
    if (usersTable) {
      const count = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
      console.log(`\n👥 Users table has ${count.rows[0]?.count || 0} records`);
    }
    
    console.log("\n✅ Database connection is working!");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Error checking database:");
    console.error(error.message);
    
    if (error.message.includes("does not exist")) {
      console.log("\n💡 Solution: Run 'npm run db:push' to create the tables");
    } else if (error.message.includes("connection")) {
      console.log("\n💡 Solution: Check your DATABASE_URL in .env file");
    }
    
    process.exit(1);
  }
}

checkTables();

