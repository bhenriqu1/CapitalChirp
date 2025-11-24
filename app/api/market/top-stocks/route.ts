import { NextResponse } from "next/server";
import { getTopStocksData } from "@/lib/market/top-stocks";

export const dynamic = "force-dynamic";
export const revalidate = 30; // Revalidate every 30 seconds

export async function GET() {
  try {
    const stocksData = await getTopStocksData();
    
    // Convert Map to array for JSON response
    const stocksArray = Array.from(stocksData.entries()).map(([ticker, data]) => ({
      ticker,
      price: data.price,
      changePercent: data.changePercent,
      volume: data.volume,
    }));

    return NextResponse.json(stocksArray);
  } catch (error) {
    console.error("Error fetching top stocks:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}

