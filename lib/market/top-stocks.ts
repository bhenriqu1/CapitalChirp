import { MarketData, getMarketData } from "./yahoo-finance";

// Top 50 most popular stocks to track (S&P 500 leaders)
export const TOP_STOCKS = [
  // Tech Giants
  "AAPL",  // Apple
  "MSFT",  // Microsoft
  "GOOGL", // Google
  "AMZN",  // Amazon
  "TSLA",  // Tesla
  "META",  // Meta (Facebook)
  "NVDA",  // NVIDIA
  "AVGO",  // Broadcom
  "ORCL",  // Oracle
  "CRM",   // Salesforce
  
  // Financial Services
  "JPM",   // JPMorgan Chase
  "BAC",   // Bank of America
  "WFC",   // Wells Fargo
  "GS",    // Goldman Sachs
  "C",     // Citigroup
  "V",     // Visa
  "MA",    // Mastercard
  "AXP",   // American Express
  
  // Healthcare
  "JNJ",   // Johnson & Johnson
  "UNH",   // UnitedHealth
  "PFE",   // Pfizer
  "ABBV",  // AbbVie
  "TMO",   // Thermo Fisher
  "ABT",   // Abbott
  
  // Consumer
  "WMT",   // Walmart
  "HD",    // Home Depot
  "MCD",   // McDonald's
  "NKE",   // Nike
  "SBUX",  // Starbucks
  "TGT",   // Target
  
  // Industrial & Energy
  "BA",    // Boeing
  "CAT",   // Caterpillar
  "XOM",   // Exxon Mobil
  "CVX",   // Chevron
  "COP",   // ConocoPhillips
  
  // Communication Services
  "DIS",   // Disney
  "NFLX",  // Netflix
  "CMCSA", // Comcast
  "T",     // AT&T
  "VZ",    // Verizon
  
  // Other Major Companies
  "PG",    // Procter & Gamble
  "KO",    // Coca-Cola
  "PEP",   // PepsiCo
  "COST",  // Costco
  "LLY",   // Eli Lilly
  "AMD",   // AMD
  "INTC",  // Intel
  "CSCO",  // Cisco
  "NEE",   // NextEra Energy
  "LIN",   // Linde
];

export async function getTopStocksData(): Promise<Map<string, MarketData>> {
  const results = new Map<string, MarketData>();
  
  // Fetch data for all top stocks in batches to respect API rate limits
  // Finnhub free tier: 60 calls/min, so we'll batch 50 requests
  const batchSize = 50;
  const batches = [];
  
  for (let i = 0; i < TOP_STOCKS.length; i += batchSize) {
    batches.push(TOP_STOCKS.slice(i, i + batchSize));
  }
  
  // Process batches sequentially to avoid rate limits
  for (const batch of batches) {
    await Promise.all(
      batch.map(async (ticker) => {
        try {
          const data = await getMarketData(ticker);
          if (data && data.price > 0) {
            results.set(ticker, data);
          }
        } catch (error) {
          console.error(`Error fetching data for ${ticker}:`, error);
          // Continue with other stocks even if one fails
        }
      })
    );
    
    // Small delay between batches to be safe with rate limits
    if (batches.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

