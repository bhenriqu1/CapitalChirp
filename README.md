# CapitalChirp

**CapitalChirp** is a social investment platform where users share stock insights and analysis. The platform uses AI to curate personalized feeds, analyze post quality, and provide real-time market data. Users can post investment insights with ticker symbols, react to posts, build reputation, and track trending stocks.

Try out platform here: https://capitalchirp.vercel.app/feed
## Description

CapitalChirp combines social networking with investment intelligence. Users create posts about stocks with optional ticker symbols and analysis types (technical, fundamental, macro, catalyst, or risk warnings). The platform uses OpenAI GPT-4o-mini to automatically analyze posts for sentiment, quality, and relevance, then ranks content in personalized feeds with AI-generated explanations. Real-time market data from Finnhub and Alpha Vantage powers a live market tracker showing the top 50 stocks. Users earn reputation scores based on engagement and can react to posts with likes, bullish, bearish, or insightful reactions.

## Tech Stack

**Frontend & Backend**
- Next.js 16 (App Router) with React 19
- TypeScript for type safety
- Tailwind CSS 4 for styling
- Server Actions for mutations

**Authentication & Database**
- Clerk for user authentication (email + OAuth)
- Neon Postgres (serverless PostgreSQL)
- Drizzle ORM for database operations

**AI & Intelligence**
- OpenAI GPT-4o-mini for post analysis and feed ranking
- Python FastAPI microservice for AI pipeline (optional)

**Market Data**
- Alpha Vantage API (primary)
- Finnhub API (fallback)
- RapidAPI Yahoo Finance (secondary fallback)

**Deployment**
- Vercel for Next.js frontend/backend
- Railway for Python AI service (optional)

## Features

- ✅ User authentication with Clerk
- ✅ Post creation with ticker symbols and analysis types
- ✅ AI-powered post analysis (tagging, sentiment, quality scoring)
- ✅ Personalized feed ranking with LLM explanations
- ✅ Reactions (like, bullish, bearish, insightful)
- ✅ User reputation system
- ✅ Trending tickers dashboard
- ✅ Market data integration

## Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- Neon Postgres database
- Clerk account
- OpenAI API key

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Copy `.env.example` to `.env` and fill in:

```env
DATABASE_URL=postgresql://user:password@host/database
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...
```

3. **Set up database:**

```bash
# Generate migration
npm run db:generate

# Push schema to database
npm run db:push
```

4. **Run development server:**

```bash
npm run dev
```

### AI Pipeline Service (Optional)

The AI pipeline can run as a separate microservice:

```bash
cd ai-pipeline
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Or with Docker:

```bash
cd ai-pipeline
docker build -t social-stock-ai .
docker run -p 8000:8000 --env-file .env social-stock-ai
```

## Project Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── feed/              # Feed page
│   └── post/              # Post pages
├── components/            # React components
│   └── ui/               # UI components
├── lib/
│   ├── db/               # Database schema and connection
│   ├── actions/          # Server actions
│   ├── llm/              # LLM functions
│   ├── market/           # Market data integration
│   └── models/           # Type definitions
├── ai-pipeline/          # Python FastAPI service
└── drizzle/              # Database migrations
```

## Database Schema

- `users` - User profiles with reputation scores
- `posts` - User posts with quality scores
- `post_tags` - Semantic tags from LLM analysis
- `reactions` - User reactions to posts
- `comments` - Post comments
- `feed_rankings` - Personalized feed rankings
- `market_data` - Cached market data

## Deployment

### Vercel (Next.js)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

### Railway (AI Pipeline)

1. Connect repository to Railway
2. Set build context to `ai-pipeline/`
3. Add environment variables
4. Deploy

## API Endpoints (AI Pipeline)

- `POST /ingest_post` - Analyze a post
- `POST /rank_feed` - Rank posts for feed
- `POST /explain_recommendation` - Explain why a post was recommended
- `GET /health` - Health check

## License

MIT
