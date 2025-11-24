"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export async function syncUser() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return null;
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return null;
    }

    // Check if user exists
    let existingUser;
    try {
      existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    } catch (error: any) {
      // Log the actual error for debugging
      console.error("Database query error:", error.message);
      console.error("Error details:", error.cause || error);
      
      // If it's a table doesn't exist error, suggest running migrations
      if (error.message?.includes("does not exist") || error.message?.includes("relation")) {
        throw new Error("Database tables not found. Please run: npm run db:push");
      }
      throw error;
    }

    if (existingUser.length === 0) {
      // Create new user
      await db.insert(users).values({
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        username: clerkUser.username || clerkUser.firstName || undefined,
        displayName: clerkUser.fullName || clerkUser.firstName || undefined,
        avatarUrl: clerkUser.imageUrl || undefined,
      });
    } else {
      // Update existing user
      await db
        .update(users)
        .set({
          email: clerkUser.emailAddresses[0]?.emailAddress || existingUser[0].email,
          username: clerkUser.username || existingUser[0].username,
          displayName: clerkUser.fullName || existingUser[0].displayName,
          avatarUrl: clerkUser.imageUrl || existingUser[0].avatarUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    return { success: true };
  } catch (error) {
    console.error("Error syncing user:", error);
    // Don't throw - allow page to render even if sync fails
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

