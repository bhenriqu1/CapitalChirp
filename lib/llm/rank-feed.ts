import OpenAI from "openai";
import { FeedItem, FeedRankingFactors } from "../models/types";
import { db } from "../db";
import { posts, users, reactions, postTags, feedRankings } from "../db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";

// Lazy initialization of OpenAI client to avoid errors during build
function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

interface PostWithMetadata {
  postId: string;
  content: string;
  ticker?: string;
  qualityScore: number;
  timeSensitivityScore: number;
  tickerRelevanceScore: number;
  userReputation: number;
  createdAt: Date;
  reactionCounts: {
    like: number;
    bullish: number;
    bearish: number;
    insightful: number;
  };
  tags: Array<{ type: string; value: string }>;
}

export async function rankFeedForUser(userId: string, limit: number = 50): Promise<FeedItem[]> {
  // Fetch recent posts with metadata
  const recentPosts = await db
    .select({
      postId: posts.id,
      content: posts.content,
      ticker: posts.ticker,
      qualityScore: posts.qualityScore,
      timeSensitivityScore: posts.timeSensitivityScore,
      tickerRelevanceScore: posts.tickerRelevanceScore,
      userId: posts.userId,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(limit * 2); // Get more posts to rank

  if (recentPosts.length === 0) {
    return [];
  }

  // Fetch user reputation scores
  const userIds = [...new Set(recentPosts.map((p) => p.userId))];
  const userReputations = await db
    .select({
      userId: users.id,
      reputationScore: users.reputationScore,
    })
    .from(users)
    .where(inArray(users.id, userIds));

  const reputationMap = new Map(
    userReputations.map((u) => [u.userId, parseFloat(u.reputationScore || "0")])
  );

  // Fetch reaction counts for each post
  const postIds = recentPosts.map((p) => p.postId);
  const reactionCounts = await db
    .select({
      postId: reactions.postId,
      reactionType: reactions.reactionType,
      count: sql<number>`count(*)`,
    })
    .from(reactions)
    .where(inArray(reactions.postId, postIds))
    .groupBy(reactions.postId, reactions.reactionType);

  const reactionMap = new Map<string, { like: number; bullish: number; bearish: number; insightful: number }>();
  recentPosts.forEach((p) => {
    reactionMap.set(p.postId, { like: 0, bullish: 0, bearish: 0, insightful: 0 });
  });

  reactionCounts.forEach((rc) => {
    const counts = reactionMap.get(rc.postId) || { like: 0, bullish: 0, bearish: 0, insightful: 0 };
    counts[rc.reactionType as keyof typeof counts] = Number(rc.count);
    reactionMap.set(rc.postId, counts);
  });

  // Fetch tags for each post
  const allTags = await db
    .select({
      postId: postTags.postId,
      tagType: postTags.tagType,
      tagValue: postTags.tagValue,
    })
    .from(postTags)
    .where(inArray(postTags.postId, postIds));

  const tagsMap = new Map<string, Array<{ type: string; value: string }>>();
  recentPosts.forEach((p) => {
    tagsMap.set(p.postId, []);
  });
  allTags.forEach((tag) => {
    const tags = tagsMap.get(tag.postId) || [];
    tags.push({ type: tag.tagType, value: tag.tagValue });
    tagsMap.set(tag.postId, tags);
  });

  // Build post metadata
  const postsWithMetadata: PostWithMetadata[] = recentPosts.map((post) => ({
    postId: post.postId,
    content: post.content,
    ticker: post.ticker || undefined,
    qualityScore: parseFloat(post.qualityScore || "0.5"),
    timeSensitivityScore: parseFloat(post.timeSensitivityScore || "0.5"),
    tickerRelevanceScore: parseFloat(post.tickerRelevanceScore || "0.5"),
    userReputation: reputationMap.get(post.userId) || 0,
    createdAt: post.createdAt,
    reactionCounts: reactionMap.get(post.postId) || { like: 0, bullish: 0, bearish: 0, insightful: 0 },
    tags: tagsMap.get(post.postId) || [],
  }));

  // Calculate freshness (hours since creation)
  const now = new Date();
  const postsWithFreshness = postsWithMetadata.map((post) => {
    const hoursAgo = (now.getTime() - post.createdAt.getTime()) / (1000 * 60 * 60);
    const freshness = Math.max(0, 1 - hoursAgo / 168); // Decay over 1 week

    // Calculate community sentiment from reactions
    const totalReactions =
      post.reactionCounts.like +
      post.reactionCounts.bullish +
      post.reactionCounts.bearish +
      post.reactionCounts.insightful;
    const bullishScore = (post.reactionCounts.bullish + post.reactionCounts.insightful) / Math.max(1, totalReactions);

    return {
      ...post,
      freshness,
      communitySentiment: bullishScore,
    };
  });

  // Use LLM to rank and explain
  const rankingPrompt = `Rank these investment posts for a user feed. Consider:
- Quality score (0-1)
- Freshness (recent posts are better)
- User reputation (0-100)
- Community sentiment (bullish reactions)
- Time sensitivity (urgent opportunities)

Return JSON object with "items" array containing top ${limit} posts:
{
  "items": [
    {
      "postId": "post_id",
      "rankScore": 0.85,
      "explanation": "Why this post is relevant",
      "factors": {
        "qualityScore": 0.8,
        "freshness": 0.9,
        "userReputation": 75,
        "communitySentiment": 0.85,
        "marketRelevance": 0.7
      }
    }
  ]
}

Posts to rank:
${JSON.stringify(
  postsWithFreshness.map((p) => ({
    postId: p.postId,
    content: p.content.substring(0, 200) + "...",
    ticker: p.ticker,
    qualityScore: p.qualityScore,
    freshness: p.freshness,
    userReputation: p.userReputation,
    communitySentiment: p.communitySentiment,
    timeSensitivity: p.timeSensitivityScore,
  })),
  null,
  2
)}`;

  // Use LLM ranking if API key is available, otherwise fall back to algorithmic
  const openai = getOpenAIClient();
  
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a feed ranking AI. Return valid JSON object with 'items' array.",
          },
          {
            role: "user",
            content: rankingPrompt,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.3,
      });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content);
    const rankedItems: FeedItem[] = parsed.items || (Array.isArray(parsed) ? parsed : []);

    // Fallback to algorithmic ranking if LLM fails
    if (rankedItems.length === 0) {
      return postsWithFreshness
        .map((post) => {
          const rankScore =
            post.qualityScore * 0.3 +
            post.freshness * 0.2 +
            (post.userReputation / 100) * 0.2 +
            post.communitySentiment * 0.15 +
            post.timeSensitivityScore * 0.15;

          return {
            postId: post.postId,
            rankScore,
            explanation: `High quality (${(post.qualityScore * 100).toFixed(0)}%) from reputable user`,
            factors: {
              qualityScore: post.qualityScore,
              freshness: post.freshness,
              userReputation: post.userReputation,
              communitySentiment: post.communitySentiment,
              marketRelevance: post.tickerRelevanceScore,
            },
          };
        })
        .sort((a, b) => b.rankScore - a.rankScore)
        .slice(0, limit);
    }

      return rankedItems.slice(0, limit);
    } catch (error) {
      console.error("Error ranking feed with LLM:", error);
      // Fall back to algorithmic ranking
    }
  }
  
  // Fallback to algorithmic ranking (used when API key is missing or LLM fails)
  return postsWithFreshness
    .map((post) => {
      const rankScore =
        post.qualityScore * 0.3 +
        post.freshness * 0.2 +
        (post.userReputation / 100) * 0.2 +
        post.communitySentiment * 0.15 +
        post.timeSensitivityScore * 0.15;

      return {
        postId: post.postId,
        rankScore,
        explanation: `Ranked by quality and engagement`,
        factors: {
          qualityScore: post.qualityScore,
          freshness: post.freshness,
          userReputation: post.userReputation,
          communitySentiment: post.communitySentiment,
          marketRelevance: post.tickerRelevanceScore,
        },
      };
    })
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, limit);
}

