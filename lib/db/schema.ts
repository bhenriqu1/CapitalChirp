import { pgTable, text, timestamp, integer, decimal, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table (extends Clerk user data)
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull(),
  username: text("username"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  reputationScore: decimal("reputation_score", { precision: 5, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  reputationIdx: index("reputation_idx").on(table.reputationScore),
}));

// Posts table
export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ticker: text("ticker"), // Optional ticker symbol
  content: text("content").notNull(),
  analysisType: text("analysis_type").notNull(), // technical, fundamental, macro, catalyst, risk_warning
  qualityScore: decimal("quality_score", { precision: 3, scale: 2 }), // 0-1 from LLM
  timeSensitivityScore: decimal("time_sensitivity_score", { precision: 3, scale: 2 }), // 0-1
  tickerRelevanceScore: decimal("ticker_relevance_score", { precision: 3, scale: 2 }), // 0-1
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  tickerIdx: index("ticker_idx").on(table.ticker),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
  qualityScoreIdx: index("quality_score_idx").on(table.qualityScore),
}));

// Post tags (semantic tags from LLM)
export const postTags = pgTable("post_tags", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  tagType: text("tag_type").notNull(), // sector, catalyst_type, risk_profile, sentiment
  tagValue: text("tag_value").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0-1
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  postIdIdx: index("post_id_idx").on(table.postId),
  tagTypeIdx: index("tag_type_idx").on(table.tagType),
}));

// Reactions table
export const reactions = pgTable("reactions", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reactionType: text("reaction_type").notNull(), // like, bullish, bearish, insightful
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  postIdIdx: index("reaction_post_id_idx").on(table.postId),
  userIdIdx: index("reaction_user_id_idx").on(table.userId),
  uniqueUserPostReaction: index("unique_user_post_reaction").on(table.userId, table.postId, table.reactionType),
}));

// Comments table
export const comments = pgTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  postIdIdx: index("comment_post_id_idx").on(table.postId),
  userIdIdx: index("comment_user_id_idx").on(table.userId),
}));

// Feed ranking cache (stores personalized feed rankings)
export const feedRankings = pgTable("feed_rankings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  rankScore: decimal("rank_score", { precision: 10, scale: 6 }).notNull(),
  explanation: text("explanation"), // LLM-generated "why am I seeing this?"
  factors: jsonb("factors"), // JSON object with breakdown of ranking factors
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("feed_user_id_idx").on(table.userId),
  postIdIdx: index("feed_post_id_idx").on(table.postId),
  rankScoreIdx: index("rank_score_idx").on(table.rankScore),
}));

// Market data cache (from Yahoo Finance)
export const marketData = pgTable("market_data", {
  id: text("id").primaryKey(),
  ticker: text("ticker").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  volume: integer("volume"),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }),
  marketCap: decimal("market_cap", { precision: 15, scale: 2 }),
  data: jsonb("data"), // Full market data JSON
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
}, (table) => ({
  tickerIdx: index("market_ticker_idx").on(table.ticker),
  lastUpdatedIdx: index("market_last_updated_idx").on(table.lastUpdated),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  reactions: many(reactions),
  comments: many(comments),
  feedRankings: many(feedRankings),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  tags: many(postTags),
  reactions: many(reactions),
  comments: many(comments),
  feedRankings: many(feedRankings),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  post: one(posts, {
    fields: [reactions.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [reactions.userId],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

