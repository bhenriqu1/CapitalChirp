"""
CapitalChirp AI Pipeline - FastAPI Microservice
Provides LLM-powered analysis and ranking for posts
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import openai
import os
import json
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CapitalChirp AI Pipeline", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY environment variable is not set")

openai.api_key = os.getenv("OPENAI_API_KEY")
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class PostAnalysisRequest(BaseModel):
    content: str
    ticker: Optional[str] = None
    analysis_type: Optional[str] = None


class Tag(BaseModel):
    type: str
    value: str
    confidence: float


class PostAnalysisResponse(BaseModel):
    tags: List[Tag]
    sentiment: str
    sector: Optional[str] = None
    catalyst_type: Optional[str] = None
    risk_profile: Optional[str] = None
    summary: str
    quality_score: float
    time_sensitivity_score: float
    ticker_relevance_score: float
    extracted_tickers: List[str]


class FeedRankingRequest(BaseModel):
    user_id: str
    posts: List[Dict[str, Any]]
    limit: int = 50


class RankingFactor(BaseModel):
    quality_score: float
    freshness: float
    user_reputation: float
    historical_accuracy: Optional[float] = None
    community_sentiment: float
    market_relevance: float


class FeedItem(BaseModel):
    post_id: str
    rank_score: float
    explanation: str
    factors: RankingFactor


class FeedRankingResponse(BaseModel):
    items: List[FeedItem]


ANALYSIS_PROMPT = """You are an expert financial analyst AI. Analyze the following investment post and extract structured insights.

Return a JSON object with this exact structure:
{
  "tags": [
    {"type": "sector", "value": "technology", "confidence": 0.9},
    {"type": "catalyst_type", "value": "earnings", "confidence": 0.8},
    {"type": "risk_profile", "value": "medium", "confidence": 0.7},
    {"type": "sentiment", "value": "bullish", "confidence": 0.85}
  ],
  "sentiment": "bullish",
  "sector": "technology",
  "catalystType": "earnings",
  "riskProfile": "medium",
  "summary": "Brief 2-3 sentence summary",
  "qualityScore": 0.85,
  "timeSensitivityScore": 0.7,
  "tickerRelevanceScore": 0.9,
  "extractedTickers": ["AAPL", "MSFT"]
}

Guidelines:
- qualityScore: 0-1 based on clarity, evidence, reasoning, novelty
- timeSensitivityScore: 0-1 based on urgency (earnings soon, breaking news = high)
- tickerRelevanceScore: 0-1 based on how relevant the ticker is to the content
- Extract all ticker symbols mentioned (uppercase, no $)
- Keep response under 300 tokens"""


@app.post("/ingest_post", response_model=PostAnalysisResponse)
async def ingest_post(request: PostAnalysisRequest):
    """Analyze a post and return structured insights"""
    try:
        prompt = f"""{ANALYSIS_PROMPT}

Post content:
{request.content}

{request.ticker if request.ticker else ""}
{request.analysis_type if request.analysis_type else ""}"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a financial analysis AI. Always return valid JSON."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=500,
            temperature=0.3,
        )

        content = response.choices[0].message.content
        if not content:
            raise HTTPException(status_code=500, detail="No response from OpenAI")

        import json
        analysis = json.loads(content)

        # Normalize scores
        analysis["quality_score"] = max(0, min(1, analysis.get("qualityScore", 0.5)))
        analysis["time_sensitivity_score"] = max(0, min(1, analysis.get("timeSensitivityScore", 0.5)))
        analysis["ticker_relevance_score"] = max(0, min(1, analysis.get("tickerRelevanceScore", 0.5)))

        # Normalize tags
        tags = []
        for tag in analysis.get("tags", []):
            tags.append(Tag(
                type=tag.get("type", ""),
                value=tag.get("value", ""),
                confidence=max(0, min(1, tag.get("confidence", 0.5)))
            ))

        return PostAnalysisResponse(
            tags=tags,
            sentiment=analysis.get("sentiment", "neutral"),
            sector=analysis.get("sector"),
            catalyst_type=analysis.get("catalystType"),
            risk_profile=analysis.get("riskProfile"),
            summary=analysis.get("summary", "Analysis unavailable"),
            quality_score=analysis["quality_score"],
            time_sensitivity_score=analysis["time_sensitivity_score"],
            ticker_relevance_score=analysis["ticker_relevance_score"],
            extracted_tickers=analysis.get("extractedTickers", [request.ticker] if request.ticker else []),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing post: {str(e)}")


@app.post("/rank_feed", response_model=FeedRankingResponse)
async def rank_feed(request: FeedRankingRequest):
    """Rank posts for a user's personalized feed"""
    try:
        ranking_prompt = f"""Rank these investment posts for a user feed. Consider:
- Quality score (0-1)
- Freshness (recent posts are better)
- User reputation (0-100)
- Community sentiment (bullish reactions)
- Time sensitivity (urgent opportunities)

Return JSON object with "items" array containing top {request.limit} posts:
{{
  "items": [
    {{
      "postId": "post_id",
      "rankScore": 0.85,
      "explanation": "Why this post is relevant",
      "factors": {{
        "qualityScore": 0.8,
        "freshness": 0.9,
        "userReputation": 75,
        "communitySentiment": 0.85,
        "marketRelevance": 0.7
      }}
    }}
  ]
}}

Posts to rank:
{request.posts}"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a feed ranking AI. Return valid JSON object with 'items' array."},
                {"role": "user", "content": ranking_prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=1000,
            temperature=0.3,
        )

        content = response.choices[0].message.content
        if not content:
            raise HTTPException(status_code=500, detail="No response from OpenAI")

        import json
        parsed = json.loads(content)
        items = parsed.get("items", [])

        # Fallback to algorithmic ranking if LLM fails
        if not items:
            items = []
            for post in request.posts[:request.limit]:
                rank_score = (
                    post.get("qualityScore", 0.5) * 0.3 +
                    post.get("freshness", 0.5) * 0.2 +
                    (post.get("userReputation", 0) / 100) * 0.2 +
                    post.get("communitySentiment", 0.5) * 0.15 +
                    post.get("timeSensitivity", 0.5) * 0.15
                )
                items.append({
                    "postId": post.get("postId"),
                    "rankScore": rank_score,
                    "explanation": f"Ranked by quality and engagement",
                    "factors": {
                        "qualityScore": post.get("qualityScore", 0.5),
                        "freshness": post.get("freshness", 0.5),
                        "userReputation": post.get("userReputation", 0),
                        "communitySentiment": post.get("communitySentiment", 0.5),
                        "marketRelevance": post.get("tickerRelevance", 0.5),
                    }
                })

        # Sort by rank score
        items.sort(key=lambda x: x.get("rankScore", 0), reverse=True)

        feed_items = []
        for item in items[:request.limit]:
            factors = item.get("factors", {})
            feed_items.append(FeedItem(
                post_id=item.get("postId", ""),
                rank_score=item.get("rankScore", 0),
                explanation=item.get("explanation", "Ranked by algorithm"),
                factors=RankingFactor(
                    quality_score=factors.get("qualityScore", 0.5),
                    freshness=factors.get("freshness", 0.5),
                    user_reputation=factors.get("userReputation", 0),
                    historical_accuracy=factors.get("historicalAccuracy"),
                    community_sentiment=factors.get("communitySentiment", 0.5),
                    market_relevance=factors.get("marketRelevance", 0.5),
                )
            ))

        return FeedRankingResponse(items=feed_items)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ranking feed: {str(e)}")


@app.post("/explain_recommendation")
async def explain_recommendation(post_id: str, user_id: str, factors: Dict[str, Any]):
    """Generate explanation for why a post was recommended"""
    try:
        prompt = f"""Explain why this post (ID: {post_id}) was recommended to user {user_id} based on these factors:
{factors}

Provide a brief, natural explanation (1-2 sentences)."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a recommendation explanation AI."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=150,
            temperature=0.5,
        )

        explanation = response.choices[0].message.content
        return {"explanation": explanation}
    except Exception as e:
        return {"explanation": "This post matches your interests and has high community engagement."}


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "capital-chirp-ai-pipeline"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

