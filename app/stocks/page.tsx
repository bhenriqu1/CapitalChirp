import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { syncUser } from "@/lib/actions/users";
import { sql, desc } from "drizzle-orm";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { getMultipleMarketData } from "@/lib/market/yahoo-finance";
import { MarketIndicatorCard } from "@/components/ui/MarketIndicatorCard";

async function getTrendingStocks() {
  // Get all unique tickers from posts (last 7 days)
  const trendingTickers = await db
    .select({
      ticker: posts.ticker,
      count: sql<number>`count(*)`,
      lastPost: sql<Date>`max(${posts.createdAt})`,
    })
    .from(posts)
    .where(
      sql`${posts.ticker} IS NOT NULL AND ${posts.createdAt} > NOW() - INTERVAL '7 days'`
    )
    .groupBy(posts.ticker)
    .orderBy(desc(sql`count(*)`))
    .limit(50);

  return trendingTickers.map((t) => ({
    ticker: t.ticker!,
    postCount: Number(t.count),
    lastPost: t.lastPost,
  }));
}

export default async function StocksPage() {
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

  const trendingStocks = await getTrendingStocks();
  const tickers = trendingStocks.map((s) => s.ticker);
  
  // Fetch market data for all tickers
  const marketDataMap = await getMultipleMarketData(tickers);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/feed" className="flex items-center gap-2 text-xl font-bold text-blue-600 hover:text-blue-700">
                <img src="/icon.png" alt="CapitalChirp" className="w-8 h-8 object-contain" />
                <span>CapitalChirp</span>
              </Link>
              <Link href="/feed" className="text-gray-700 hover:text-blue-600 font-medium">
                Feed
              </Link>
              <Link href="/stocks" className="text-blue-600 font-medium">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Stock Feed</h1>
          <p className="text-gray-600">Real-time market data for trending stocks discussed on the platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {trendingStocks.map((stock) => {
            const marketData = marketDataMap.get(stock.ticker);
            
            return (
              <Link key={stock.ticker} href={`/ticker/${stock.ticker}`}>
                <div className="hover:scale-105 transition-transform">
                  {marketData && marketData.price > 0 ? (
                    <MarketIndicatorCard
                      ticker={stock.ticker}
                      price={marketData.price}
                      changePercent={marketData.changePercent}
                      volume={marketData.volume}
                      postCount={stock.postCount}
                    />
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg text-gray-900">{stock.ticker}</span>
                        <span className="text-xs text-gray-500">{stock.postCount} posts</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {marketData === null ? "Add API key for live data" : "Market data unavailable"}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {trendingStocks.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">No stocks being discussed yet.</p>
            <Link
              href="/post/create"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Post
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

