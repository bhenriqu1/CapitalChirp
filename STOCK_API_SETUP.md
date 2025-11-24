# Stock Market Data API Setup

The app supports multiple free stock market data APIs. Choose one that works best for you.

## Option 1: Alpha Vantage (Recommended - Easiest)

**Free Tier:**
- 5 API calls per minute
- 500 API calls per day
- Real-time and historical data

**Setup:**
1. Go to https://www.alphavantage.co/support/#api-key
2. Fill out the form (just name and email)
3. Get your free API key instantly
4. Add to `.env`:
   ```env
   ALPHA_VANTAGE_API_KEY=your_key_here
   ```

**Pros:** Very easy to get, reliable, good documentation
**Cons:** Rate limited (5 calls/min)

## Option 2: Finnhub (Best for High Volume)

**Free Tier:**
- 60 API calls per minute
- Real-time quotes
- Good for multiple stocks

**Setup:**
1. Go to https://finnhub.io/
2. Sign up for free account
3. Get your API key from dashboard
4. Add to `.env`:
   ```env
   FINNHUB_API_KEY=your_key_here
   ```

**Pros:** Higher rate limits, fast
**Cons:** Requires signup

## Option 3: RapidAPI Yahoo Finance (Paid)

**Setup:**
1. Go to RapidAPI
2. Subscribe to Yahoo Finance API
3. Add to `.env`:
   ```env
   RAPIDAPI_YAHOO_FINANCE_KEY=your_key_here
   ```

**Pros:** Most comprehensive data
**Cons:** Paid service

## Recommendation

For development and small projects: **Alpha Vantage** (easiest, free)
For production with many users: **Finnhub** (higher limits, still free)

## How It Works

The app will automatically try APIs in this order:
1. Alpha Vantage (if `ALPHA_VANTAGE_API_KEY` is set)
2. Finnhub (if `FINNHUB_API_KEY` is set)
3. RapidAPI Yahoo Finance (if `RAPIDAPI_YAHOO_FINANCE_KEY` is set)

If none are configured, the app will still work but won't show market data.

## Testing

After adding your API key:
1. Restart your dev server
2. Go to `/stocks` page
3. You should see real stock prices and changes

