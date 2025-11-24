import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { posts, users, reactions } from "@/lib/db/schema";
import { MarketIndicatorCard } from "@/components/ui/MarketIndicatorCard";
import { ReputationBadge } from "@/components/ui/ReputationBadge";
import { syncUser } from "@/lib/actions/users";
import { sql, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { getMarketData } from "@/lib/market/yahoo-finance";

async function getDashboardData(userId: string) {
  // Get user stats
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const userData = user[0];

  // Get trending tickers (most mentioned in last 24 hours)
  const trendingTickers = await db
    .select({
      ticker: posts.ticker,
      count: sql<number>`count(*)`,
    })
    .from(posts)
    .where(
      sql`${posts.ticker} IS NOT NULL AND ${posts.createdAt} > NOW() - INTERVAL '24 hours'`
    )
    .groupBy(posts.ticker)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  // Get top posts by quality score
  const topPosts = await db
    .select({
      id: posts.id,
      content: posts.content,
      ticker: posts.ticker,
      qualityScore: posts.qualityScore,
      createdAt: posts.createdAt,
      userId: posts.userId,
    })
    .from(posts)
    .where(sql`${posts.qualityScore} IS NOT NULL`)
    .orderBy(desc(posts.qualityScore))
    .limit(5);

  // Get reputation leaderboard
  const leaderboard = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      username: users.username,
      reputationScore: users.reputationScore,
    })
    .from(users)
    .orderBy(desc(users.reputationScore))
    .limit(10);

  // Get user's post count
  const userPostCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(eq(posts.userId, userId));

  return {
    user: userData,
    trendingTickers: trendingTickers.map((t) => ({
      ticker: t.ticker!,
      postCount: Number(t.count),
    })),
    topPosts,
    leaderboard: leaderboard.map((u) => ({
      ...u,
      reputationScore: parseFloat(u.reputationScore || "0"),
    })),
    userPostCount: Number(userPostCount[0]?.count || 0),
  };
}

export default async function DashboardPage() {
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

  let data;
  let marketDataMap = new Map();
  
  try {
    data = await getDashboardData(userId);

    // Fetch market data for trending tickers (with error handling)
    const marketDataPromises = data.trendingTickers.map(async (t) => {
      try {
        return await getMarketData(t.ticker);
      } catch (error) {
        console.error(`Failed to fetch market data for ${t.ticker}:`, error);
        return null;
      }
    });
    const marketDataResults = await Promise.all(marketDataPromises);
    marketDataMap = new Map(
      data.trendingTickers.map((t, i) => [t.ticker, marketDataResults[i]]).filter(([_, data]) => data !== null)
    );
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    // Return empty data structure to prevent crash
    data = {
      user: null,
      trendingTickers: [],
      topPosts: [],
      leaderboard: [],
      userPostCount: 0,
    };
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/feed" className="flex items-center gap-2 text-xl font-bold text-blue-600 hover:text-blue-700 cursor-pointer" prefetch={true}>
                <img src="/icon.png" alt="CapitalChirp" className="w-8 h-8 object-contain" />
                <span>CapitalChirp</span>
              </Link>
              <Link href="/feed" className="text-gray-700 hover:text-blue-600 font-medium" prefetch={true}>
                Feed
              </Link>
              <Link href="/stocks" className="text-gray-700 hover:text-blue-600 font-medium">
                Live Stocks
              </Link>
              <Link href="/market" className="text-gray-700 hover:text-blue-600 font-medium">
                Market Tracker
              </Link>
              <Link href="/dashboard" className="text-blue-600 font-medium">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of trending insights and market activity</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* User Stats Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Reputation</span>
                {data.user?.reputationScore && (
                  <ReputationBadge score={parseFloat(data.user.reputationScore)} />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Posts</span>
                <span className="font-semibold text-gray-900">{data.userPostCount}</span>
              </div>
            </div>
          </div>

          {/* Trending Tickers */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Trending Tickers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.trendingTickers.map((ticker) => {
                const marketData = marketDataMap.get(ticker.ticker);
                if (!marketData) return null;

                return (
                  <MarketIndicatorCard
                    key={ticker.ticker}
                    ticker={ticker.ticker}
                    price={marketData.price}
                    changePercent={marketData.changePercent}
                    volume={marketData.volume}
                    postCount={ticker.postCount}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reputation Leaderboard</h2>
          <div className="space-y-2">
            {data.leaderboard.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-medium w-6">#{index + 1}</span>
                  <span className="font-medium text-gray-900">
                    {user.displayName || user.username || "Anonymous"}
                  </span>
                </div>
                <ReputationBadge score={user.reputationScore} />
              </div>
            ))}
          </div>
        </div>

        {/* Top Quality Posts */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Quality Insights</h2>
          <div className="space-y-4">
            {data.topPosts.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {post.ticker && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                        {post.ticker}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {post.qualityScore && (
                    <span className="text-xs font-medium text-gray-600">
                      Quality: {(parseFloat(post.qualityScore) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <p className="text-gray-800 line-clamp-2">{post.content}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

