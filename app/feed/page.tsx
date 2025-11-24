import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { posts, users, reactions, postTags, feedRankings } from "@/lib/db/schema";
import { rankFeedForUser } from "@/lib/llm/rank-feed";
import { PostCard } from "@/components/ui/PostCard";
import { syncUser } from "@/lib/actions/users";
import { eq, sql, inArray } from "drizzle-orm";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";

async function getFeed(userId: string) {
  // Get ranked feed items
  const rankedItems = await rankFeedForUser(userId, 20);

  if (rankedItems.length === 0) {
    return [];
  }

  // Fetch full post data
  const postIds = rankedItems.map((item) => item.postId);
  
  if (postIds.length === 0) {
    return [];
  }

  const feedPosts = await db
    .select({
      id: posts.id,
      content: posts.content,
      ticker: posts.ticker,
      analysisType: posts.analysisType,
      qualityScore: posts.qualityScore,
      createdAt: posts.createdAt,
      userId: posts.userId,
    })
    .from(posts)
    .where(inArray(posts.id, postIds));

  // Fetch users
  const userIds = [...new Set(feedPosts.map((p) => p.userId))];
  const feedUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, userIds));

  const userMap = new Map(feedUsers.map((u) => [u.id, u]));

  // Fetch reactions
  const allReactions = await db
    .select({
      postId: reactions.postId,
      reactionType: reactions.reactionType,
      count: sql<number>`count(*)`,
    })
    .from(reactions)
    .where(inArray(reactions.postId, postIds))
    .groupBy(reactions.postId, reactions.reactionType);

  const reactionMap = new Map<string, { like: number; bullish: number; bearish: number; insightful: number }>();
  postIds.forEach((id) => {
    reactionMap.set(id, { like: 0, bullish: 0, bearish: 0, insightful: 0 });
  });
  allReactions.forEach((r) => {
    const counts = reactionMap.get(r.postId) || { like: 0, bullish: 0, bearish: 0, insightful: 0 };
    counts[r.reactionType as keyof typeof counts] = Number(r.count);
    reactionMap.set(r.postId, counts);
  });

  // Fetch tags
  const allTags = await db
    .select({
      postId: postTags.postId,
      tagType: postTags.tagType,
      tagValue: postTags.tagValue,
    })
    .from(postTags)
    .where(inArray(postTags.postId, postIds));

  const tagsMap = new Map<string, Array<{ type: string; value: string }>>();
  postIds.forEach((id) => {
    tagsMap.set(id, []);
  });
  allTags.forEach((tag) => {
    const tags = tagsMap.get(tag.postId) || [];
    tags.push({ type: tag.tagType, value: tag.tagValue });
    tagsMap.set(tag.postId, tags);
  });

  // Combine data
  const rankedMap = new Map(rankedItems.map((item) => [item.postId, item]));

  return feedPosts
    .map((post) => {
      const ranked = rankedMap.get(post.id);
      const user = userMap.get(post.userId);
      if (!user) return null;

      return {
        id: post.id,
        content: post.content,
        ticker: post.ticker || undefined,
        analysisType: post.analysisType,
        qualityScore: post.qualityScore ? parseFloat(post.qualityScore) : undefined,
        createdAt: post.createdAt,
        user: {
          id: user.id,
          displayName: user.displayName || undefined,
          username: user.username || undefined,
          avatarUrl: user.avatarUrl || undefined,
          reputationScore: user.reputationScore ? parseFloat(user.reputationScore) : undefined,
        },
        tags: tagsMap.get(post.id) || [],
        reactions: reactionMap.get(post.id),
        explanation: ranked?.explanation,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => {
      const scoreA = rankedMap.get(a.id)?.rankScore || 0;
      const scoreB = rankedMap.get(b.id)?.rankScore || 0;
      return scoreB - scoreA;
    });
}

export default async function FeedPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Sync user with Clerk (don't block on error)
  try {
    await syncUser();
  } catch (error) {
    console.error("Failed to sync user:", error);
    // Continue anyway - user can still use the app
  }

  const user = await currentUser();
  let feedPosts: Awaited<ReturnType<typeof getFeed>> = [];
  
  try {
    feedPosts = await getFeed(userId);
  } catch (error) {
    console.error("Failed to load feed:", error);
    // Show empty state instead of crashing
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/feed" className="flex items-center gap-2 text-xl font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
                <Image src="/icon.png" alt="CapitalChirp" width={32} height={32} className="object-contain" />
                <span>CapitalChirp</span>
              </Link>
              <Link href="/feed" className="text-blue-600 font-medium">
                Feed
              </Link>
              <Link href="/stocks" className="text-gray-700 hover:text-blue-600 font-medium">
                Live Stocks
              </Link>
              <Link href="/market" className="text-gray-700 hover:text-blue-600 font-medium">
                Market Tracker
              </Link>
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">
                Dashboard
              </Link>
              <Link href="/post/create" className="text-gray-700 hover:text-blue-600 font-medium">
                New Post
              </Link>
            </div>
            <UserButton />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Feed</h1>
          <p className="text-gray-600">AI-curated investment insights personalized for you</p>
        </div>

        <div className="space-y-6">
          {feedPosts.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500 mb-4">No posts yet. Be the first to share an insight!</p>
              <Link
                href="/post/create"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Post
              </Link>
            </div>
          ) : (
            feedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={userId}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

