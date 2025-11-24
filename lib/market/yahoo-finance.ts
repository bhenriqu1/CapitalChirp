export interface MarketData {
  ticker: string;
  price: number;
  volume: number;
  changePercent: number;
  marketCap?: number;
  data: Record<string, any>;
}

/**
 * Fetch market data using Finnhub 
 */
export async function getMarketData(ticker: string): Promise<MarketData | null> {
  try {
    // Option 1: Alpha Vantage (free, 5 calls/min, 500 calls/day)
    if (process.env.ALPHA_VANTAGE_API_KEY) {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`,
        {
          next: { revalidate: 60 }, // Cache for 60 seconds
        }
      );

      if (response.ok) {
        const data = await response.json();
        const quote = data["Global Quote"];
        if (quote && quote["05. price"]) {
          const price = parseFloat(quote["05. price"]);
          const previousClose = parseFloat(quote["08. previous close"] || price);
          const changePercent = previousClose > 0 ? ((price - previousClose) / previousClose) * 100 : 0;
          
          return {
            ticker: ticker.toUpperCase(),
            price: price,
            volume: parseInt(quote["06. volume"] || "0"),
            changePercent: changePercent,
            marketCap: undefined, // Alpha Vantage free tier doesn't include market cap
            data: quote,
          };
        }
      }
    }

    // Option 2: Finnhub (free tier: 60 calls/min)
    if (process.env.FINNHUB_API_KEY) {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${process.env.FINNHUB_API_KEY}`,
        {
          next: { revalidate: 60 }, // Cache for 60 seconds
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.c && data.c > 0) {
          const price = data.c; // Current price
          const previousClose = data.pc || price; // Previous close
          const changePercent = previousClose > 0 ? ((price - previousClose) / previousClose) * 100 : 0;
          
          return {
            ticker: ticker.toUpperCase(),
            price: price,
            volume: data.v || 0, // Volume
            changePercent: changePercent,
            marketCap: undefined,
            data: data,
          };
        }
      }
    }

    // Option 3: RapidAPI Yahoo Finance (if API key is provided)
    if (process.env.RAPIDAPI_YAHOO_FINANCE_KEY) {
      const response = await fetch(
        `https://yahoo-finance15.p.rapidapi.com/api/v1/markets/stock/quotes?ticker=${ticker}`,
        {
          headers: {
            "X-RapidAPI-Key": process.env.RAPIDAPI_YAHOO_FINANCE_KEY,
            "X-RapidAPI-Host": "yahoo-finance15.p.rapidapi.com",
          },
          next: { revalidate: 60 },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const quote = data.body?.[0];
        if (quote) {
          return {
            ticker: ticker.toUpperCase(),
            price: quote.regularMarketPrice || 0,
            volume: quote.regularMarketVolume || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            marketCap: quote.marketCap,
            data: quote,
          };
        }
      }
    }

    // Fallback: Return null if no API is configured
    console.warn(`Market data API not configured for ${ticker}. Add ALPHA_VANTAGE_API_KEY or FINNHUB_API_KEY to .env`);
    return null;
  } catch (error) {
    console.error(`Error fetching market data for ${ticker}:`, error);
    return null;
  }
}

export async function getMultipleMarketData(tickers: string[]): Promise<Map<string, MarketData>> {
  const results = new Map<string, MarketData>();
  
  await Promise.all(
    tickers.map(async (ticker) => {
      const data = await getMarketData(ticker);
      if (data) {
        results.set(ticker.toUpperCase(), data);
      }
    })
  );

  return results;
}

