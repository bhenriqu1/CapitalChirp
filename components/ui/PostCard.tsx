"use client";

import React from "react";
import { TickerTag } from "./TickerTag";
import { SentimentChip } from "./SentimentChip";
import { SectorTag } from "./SectorTag";
import { ReputationBadge } from "./ReputationBadge";
import { addReaction, deletePost } from "@/lib/actions/posts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    ticker?: string;
    analysisType: string;
    qualityScore?: number;
    createdAt: Date;
    user: {
      id: string;
      displayName?: string;
      username?: string;
      avatarUrl?: string;
      reputationScore?: number;
    };
    tags?: Array<{ type: string; value: string }>;
    reactions?: {
      like: number;
      bullish: number;
      bearish: number;
      insightful: number;
    };
    explanation?: string;
  };
  currentUserId?: string;
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const sentimentTag = post.tags?.find((t) => t.type === "sentiment")?.value || "neutral";
  const sectorTag = post.tags?.find((t) => t.type === "sector")?.value;
  const isOwner = currentUserId === post.user.id;

  const handleReaction = async (reactionType: "like" | "bullish" | "bearish" | "insightful") => {
    try {
      await addReaction(post.id, reactionType);
      router.refresh(); // Refresh to show updated reaction counts
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      await deletePost(post.id);
      router.refresh();
      router.push("/feed"); // Redirect to feed after deletion
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Failed to delete post. Please try again.");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <article className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {post.user.displayName?.[0] || post.user.username?.[0] || "U"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {post.user.displayName || post.user.username || "Anonymous"}
              </span>
              {post.user.reputationScore !== undefined && (
                <ReputationBadge score={post.user.reputationScore} />
              )}
            </div>
            <span className="text-sm text-gray-500">
              {new Date(post.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.ticker && <TickerTag ticker={post.ticker} />}
          <SentimentChip sentiment={sentimentTag as "bullish" | "bearish" | "neutral"} />
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {sectorTag && (
        <div className="mb-4">
          <SectorTag sector={sectorTag} />
        </div>
      )}

      {post.explanation && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">Why you're seeing this:</span> {post.explanation}
          </p>
        </div>
      )}

      {post.qualityScore !== undefined && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Quality Score:</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${post.qualityScore * 100}%` }}
              />
            </div>
            <span className="font-medium">{(post.qualityScore * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => handleReaction("like")}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          <span>👍</span>
          <span>{post.reactions?.like || 0}</span>
        </button>
        <button
          onClick={() => handleReaction("bullish")}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-green-600 transition-colors"
        >
          <span>🐂</span>
          <span>{post.reactions?.bullish || 0}</span>
        </button>
        <button
          onClick={() => handleReaction("bearish")}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors"
        >
          <span>🐻</span>
          <span>{post.reactions?.bearish || 0}</span>
        </button>
        <button
          onClick={() => handleReaction("insightful")}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-purple-600 transition-colors"
        >
          <span>💡</span>
          <span>{post.reactions?.insightful || 0}</span>
        </button>
        <div className="ml-auto flex items-center gap-3">
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                showDeleteConfirm
                  ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                  : "text-gray-600 hover:text-red-600 hover:bg-red-50"
              } ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
              title="Delete your post"
            >
              <span>🗑️</span>
              <span>{isDeleting ? "Deleting..." : showDeleteConfirm ? "Confirm Delete" : "Delete"}</span>
            </button>
          )}
          <Link
            href={`/post/${post.id}`}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View →
          </Link>
        </div>
      </div>
    </article>
  );
}

