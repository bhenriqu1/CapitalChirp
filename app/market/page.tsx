"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { MarketIndicatorCard } from "@/components/ui/MarketIndicatorCard";
import { TOP_STOCKS } from "@/lib/market/top-stocks";

interface StockData {
  ticker: string;
  price: number;
  changePercent: number;
  volume: number;
}

export default function MarketPage() {
  const [stocks, setStocks] = useState<Map<string, StockData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStockData = async () => {
    try {
      const response = await fetch("/api/market/top-stocks");
      if (response.ok) {
        const data = await response.json();
        const stocksMap = new Map<string, StockData>();
        data.forEach((stock: StockData) => {
          stocksMap.set(stock.ticker, stock);
        });
        setStocks(stocksMap);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStockData, 30000);
    return () => clearInterval(interval);
  }, []);

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
              <Link href="/market" className="text-blue-600 font-medium">
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Market Tracker</h1>
            <p className="text-gray-600">Top 50 stocks - Updates every 30 seconds</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            {loading && (
              <div className="text-xs text-blue-600 mt-1">Refreshing...</div>
            )}
          </div>
        </div>

        {loading && stocks.size === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {TOP_STOCKS.map((ticker) => (
              <div
                key={ticker}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm animate-pulse"
              >
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {TOP_STOCKS.map((ticker) => {
              const stockData = stocks.get(ticker);
              
              return (
                <Link key={ticker} href={`/ticker/${ticker}`}>
                  <div className="hover:scale-105 transition-transform">
                    {stockData ? (
                      <MarketIndicatorCard
                        ticker={ticker}
                        price={stockData.price}
                        changePercent={stockData.changePercent}
                        volume={stockData.volume}
                      />
                    ) : (
                      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-lg text-gray-900">{ticker}</span>
                        </div>
                        <div className="text-sm text-gray-500">Loading data...</div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && stocks.size === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">Unable to load market data.</p>
            <p className="text-sm text-gray-400">
              Make sure FINNHUB_API_KEY is set in your .env file
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

