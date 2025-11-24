import OpenAI from "openai";
import { LLMPostAnalysis } from "../models/types";

// Lazy initialization of OpenAI client to avoid errors during build
function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

const ANALYSIS_PROMPT = `You are an expert financial analyst AI. Analyze the following investment post and extract structured insights.

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
- Keep response under 300 tokens`;

export async function analyzePost(
  content: string,
  ticker?: string,
  analysisType?: string
): Promise<LLMPostAnalysis> {
  const prompt = `${ANALYSIS_PROMPT}

Post content:
${content}

${ticker ? `Ticker: ${ticker}` : ""}
${analysisType ? `Analysis Type: ${analysisType}` : ""}`;

  const openai = getOpenAIClient();
  
  if (!openai) {
    // Return default analysis if API key is not available
    console.warn("OPENAI_API_KEY not set, using default analysis");
    return {
      tags: [],
      sentiment: "neutral",
      summary: "Analysis unavailable - API key not configured",
      qualityScore: 0.5,
      timeSensitivityScore: 0.5,
      tickerRelevanceScore: ticker ? 0.8 : 0.3,
      extractedTickers: ticker ? [ticker.toUpperCase()] : [],
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective model
      messages: [
        {
          role: "system",
          content: "You are a financial analysis AI. Always return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.3, // Lower temperature for more deterministic output
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const analysis = JSON.parse(content) as LLMPostAnalysis;

    // Validate and normalize
    return {
      ...analysis,
      qualityScore: Math.max(0, Math.min(1, analysis.qualityScore)),
      timeSensitivityScore: Math.max(0, Math.min(1, analysis.timeSensitivityScore)),
      tickerRelevanceScore: Math.max(0, Math.min(1, analysis.tickerRelevanceScore)),
      tags: analysis.tags.map((tag) => ({
        ...tag,
        confidence: Math.max(0, Math.min(1, tag.confidence)),
      })),
    };
  } catch (error) {
    console.error("Error analyzing post:", error);
    // Return default analysis on error
    return {
      tags: [],
      sentiment: "neutral",
      summary: "Analysis unavailable",
      qualityScore: 0.5,
      timeSensitivityScore: 0.5,
      tickerRelevanceScore: ticker ? 0.8 : 0.3,
      extractedTickers: ticker ? [ticker.toUpperCase()] : [],
    };
  }
}

