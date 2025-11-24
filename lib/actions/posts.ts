"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "../db";
import { posts, postTags, reactions } from "../db/schema";
import { createPostSchema } from "../models/types";
import { analyzePost } from "../llm/analyze";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

export async function createPost(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const rawData = {
    ticker: formData.get("ticker")?.toString(),
    content: formData.get("content")?.toString() || "",
    analysisType: formData.get("analysisType")?.toString() || "fundamental",
  };

  const validated = createPostSchema.parse(rawData);

  const postId = nanoid();

  // Create post
  await db.insert(posts).values({
    id: postId,
    userId,
    ticker: validated.ticker?.toUpperCase(),
    content: validated.content,
    analysisType: validated.analysisType,
  });

  // Analyze post with LLM (async, don't wait)
  analyzePost(validated.content, validated.ticker, validated.analysisType)
    .then(async (analysis) => {
      // Update post with scores
      await db
        .update(posts)
        .set({
          qualityScore: analysis.qualityScore.toString(),
          timeSensitivityScore: analysis.timeSensitivityScore.toString(),
          tickerRelevanceScore: analysis.tickerRelevanceScore.toString(),
        })
        .where(eq(posts.id, postId));

      // Insert tags
      if (analysis.tags.length > 0) {
        await db.insert(postTags).values(
          analysis.tags.map((tag) => ({
            id: nanoid(),
            postId,
            tagType: tag.type,
            tagValue: tag.value,
            confidence: tag.confidence.toString(),
          }))
        );
      }
    })
    .catch((error) => {
      console.error("Error analyzing post:", error);
    });

  revalidatePath("/feed");
  revalidatePath("/dashboard");
  revalidatePath("/stocks");
  return { success: true, postId };
}

export async function addReaction(postId: string, reactionType: "like" | "bullish" | "bearish" | "insightful") {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check if reaction already exists
  const existing = await db
    .select()
    .from(reactions)
    .where(and(eq(reactions.postId, postId), eq(reactions.userId, userId), eq(reactions.reactionType, reactionType)))
    .limit(1);

  if (existing.length > 0) {
    // Remove reaction (toggle)
    await db
      .delete(reactions)
      .where(and(eq(reactions.postId, postId), eq(reactions.userId, userId), eq(reactions.reactionType, reactionType)));
  } else {
    // Add reaction
    await db.insert(reactions).values({
      id: nanoid(),
      postId,
      userId,
      reactionType,
    });
  }

  revalidatePath("/feed");
  return { success: true };
}

export async function deletePost(postId: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Verify the user owns this post
  const post = await db
    .select({ userId: posts.userId })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (post.length === 0) {
    throw new Error("Post not found");
  }

  if (post[0].userId !== userId) {
    throw new Error("You can only delete your own posts");
  }

  // Delete the post (cascade will delete related reactions, comments, tags)
  await db.delete(posts).where(eq(posts.id, postId));

  revalidatePath("/feed");
  revalidatePath("/dashboard");
  revalidatePath("/stocks");
  return { success: true };
}

