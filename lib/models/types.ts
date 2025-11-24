import { z } from "zod";

// Post creation schema
export const createPostSchema = z.object({
  ticker: z.string().optional(),
  content: z.string().min(10).max(5000),
  analysisType: z.enum(["technical", "fundamental", "macro", "catalyst", "risk_warning"]),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

// Reaction types
export const reactionTypeSchema = z.enum(["like", "bullish", "bearish", "insightful"]);
export type ReactionType = z.infer<typeof reactionTypeSchema>;

// LLM pipeline response types
export interface LLMPostAnalysis {
  tags: Array<{
    type: "sector" | "catalyst_type" | "risk_profile" | "sentiment";
    value: string;
    confidence: number;
  }>;
  sentiment: "bullish" | "bearish" | "neutral";
  sector?: string;
  catalystType?: string;
  riskProfile?: string;
  summary: string;
  qualityScore: number; // 0-1
  timeSensitivityScore: number; // 0-1
  tickerRelevanceScore: number; // 0-1
  extractedTickers: string[];
}

export interface FeedRankingFactors {
  qualityScore: number;
  freshness: number;
  userReputation: number;
  historicalAccuracy?: number;
  communitySentiment: number;
  marketRelevance: number;
}

export interface FeedItem {
  postId: string;
  rankScore: number;
  explanation: string;
  factors: FeedRankingFactors;
}

