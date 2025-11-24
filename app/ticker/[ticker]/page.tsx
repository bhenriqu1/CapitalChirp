import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { posts, users, reactions, postTags } from "@/lib/db/schema";
import { syncUser } from "@/lib/actions/users";
import { eq, sql, inArray, desc } from "drizzle-orm";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { PostCard } from "@/components/ui/PostCard";
import { getMarketData } from "@/lib/market/yahoo-finance";
import { MarketIndicatorCard } from "@/components/ui/MarketIndicatorCard";

async function getTickerPosts(ticker: string) {
  // Get all posts for this ticker
  const tickerPosts = await db
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
    .where(eq(posts.ticker, ticker.toUpperCase()))
    .orderBy(desc(posts.createdAt));

  if (tickerPosts.length === 0) {
    return [];
  }

  // Fetch users
  const userIds = [...new Set(tickerPosts.map((p) => p.userId))];
  const tickerUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, userIds));

  const userMap = new Map(tickerUsers.map((u) => [u.id, u]));

  // Fetch reactions
  const postIds = tickerPosts.map((p) => p.id);
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

  return tickerPosts.map((post) => {
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
    };
  }).filter((p): p is NonNullable<typeof p> => p !== null);
}

export default async function TickerPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Sync user with Clerk
  try {
    await syncUser();
  } catch (error) {
    console.error("Failed to sync user:", error);
  }

  const resolvedParams = await params;
  const ticker = decodeURIComponent(resolvedParams.ticker).toUpperCase();
  const tickerPosts = await getTickerPosts(ticker);
  const marketData = await getMarketData(ticker);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/feed" className="flex items-center gap-2 text-xl font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
                <img src="/icon.png" alt="CapitalChirp" className="w-8 h-8 object-contain" />
                <span>CapitalChirp</span>
              </Link>
              <Link href="/feed" className="text-gray-700 hover:text-blue-600 font-medium">
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
        <Link
          href="/stocks"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          ← Back to Live Stocks
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{ticker} Posts</h1>
          <p className="text-gray-600">All insights and discussions about {ticker}</p>
        </div>

        {/* Market Data Card */}
        {marketData && marketData.price > 0 && (
          <div className="mb-8">
            <MarketIndicatorCard
              ticker={ticker}
              price={marketData.price}
              changePercent={marketData.changePercent}
              volume={marketData.volume}
              postCount={tickerPosts.length}
            />
          </div>
        )}

        {/* Posts */}
        <div className="space-y-6">
          {tickerPosts.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500 mb-4">No posts about {ticker} yet.</p>
              <Link
                href={`/post/create?ticker=${ticker}`}
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Be the first to post about {ticker}
              </Link>
            </div>
          ) : (
            tickerPosts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={userId} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

