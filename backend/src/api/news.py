"""
News API Routes
Provides news data with FinBERT sentiment analysis
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import random

router = APIRouter()


# ===== Pydantic Models =====

class NewsItem(BaseModel):
    id: str
    title: str
    description: Optional[str]
    source: str
    url: str
    published_at: str
    sentiment: str  # positive, neutral, negative
    sentiment_score: float
    relevant_assets: List[str]
    ai_summary: Optional[str] = None


# ===== Mock News Data =====

MOCK_NEWS = [
    {
        "id": "1",
        "title": "Bitcoin ETF approval drives institutional adoption surge",
        "description": "Major financial institutions are racing to offer cryptocurrency services following the historic ETF approval.",
        "source": "CoinDesk",
        "sentiment": "positive",
        "sentiment_score": 0.89,
        "relevant_assets": ["BTC-USD", "ETH-USD"],
        "ai_summary": "Institutional adoption accelerating with ETF approval. Bullish signal for major cryptocurrencies."
    },
    {
        "id": "2",
        "title": "Federal Reserve signals potential rate cuts in Q1",
        "description": "Fed Chair indicates readiness to adjust monetary policy as inflation metrics improve.",
        "source": "Bloomberg",
        "sentiment": "positive",
        "sentiment_score": 0.72,
        "relevant_assets": ["XAU-USD", "AAPL", "MSFT"],
        "ai_summary": "Rate cuts typically positive for risk assets. Watch for equity market rally."
    },
    {
        "id": "3",
        "title": "Market volatility increases amid geopolitical tensions",
        "description": "Global markets experience heightened uncertainty as diplomatic relations deteriorate.",
        "source": "Reuters",
        "sentiment": "negative",
        "sentiment_score": 0.65,
        "relevant_assets": ["XAU-USD"],
        "ai_summary": "Safe-haven assets likely to benefit. Gold showing strength amid uncertainty."
    },
    {
        "id": "4",
        "title": "NVIDIA announces breakthrough AI chip architecture",
        "description": "The new Blackwell Ultra series promises revolutionary performance for AI workloads.",
        "source": "TechCrunch",
        "sentiment": "positive",
        "sentiment_score": 0.91,
        "relevant_assets": ["NVDA"],
        "ai_summary": "Strong catalyst for NVDA. AI hardware demand remains robust."
    },
    {
        "id": "5",
        "title": "Ethereum network upgrade reduces gas fees by 40%",
        "description": "The Pectra upgrade goes live, significantly improving transaction efficiency.",
        "source": "The Block",
        "sentiment": "positive",
        "sentiment_score": 0.85,
        "relevant_assets": ["ETH-USD"],
        "ai_summary": "Technical improvement bullish for ETH adoption."
    },
    {
        "id": "6",
        "title": "Regulatory crackdown on crypto exchanges intensifies",
        "description": "Several countries announce stricter compliance requirements for trading platforms.",
        "source": "Financial Times",
        "sentiment": "negative",
        "sentiment_score": 0.58,
        "relevant_assets": ["BTC-USD", "ETH-USD"],
        "ai_summary": "Short-term negative pressure possible. Long-term clarity may benefit regulated players."
    },
    {
        "id": "7",
        "title": "Apple reports record Q4 iPhone sales in emerging markets",
        "description": "Strong demand in India and Southeast Asia drives revenue growth.",
        "source": "CNBC",
        "sentiment": "positive",
        "sentiment_score": 0.78,
        "relevant_assets": ["AAPL"],
        "ai_summary": "Emerging market expansion positive for long-term growth trajectory."
    },
    {
        "id": "8",
        "title": "Gold prices hit new highs as central banks increase reserves",
        "description": "Global central banks continue diversifying away from dollar holdings.",
        "source": "WSJ",
        "sentiment": "positive",
        "sentiment_score": 0.82,
        "relevant_assets": ["XAU-USD"],
        "ai_summary": "Structural demand supporting gold prices. Bullish medium-term outlook."
    },
]


# ===== Routes =====

@router.get("/", response_model=List[NewsItem])
async def get_news(
    asset: Optional[str] = Query(None, description="Filter by asset symbol"),
    sentiment: Optional[str] = Query(None, description="Filter by sentiment"),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get latest news with sentiment analysis
    """
    news = []
    
    for item in MOCK_NEWS:
        # Apply filters
        if asset and asset.upper() not in item["relevant_assets"]:
            continue
        if sentiment and item["sentiment"] != sentiment:
            continue
        
        # Add timestamp
        hours_ago = random.randint(1, 24)
        published = datetime.utcnow() - timedelta(hours=hours_ago)
        
        news.append(NewsItem(
            id=item["id"],
            title=item["title"],
            description=item["description"],
            source=item["source"],
            url=f"https://example.com/news/{item['id']}",
            published_at=published.isoformat(),
            sentiment=item["sentiment"],
            sentiment_score=item["sentiment_score"],
            relevant_assets=item["relevant_assets"],
            ai_summary=item["ai_summary"]
        ))
    
    return news[:limit]


@router.get("/asset/{symbol}", response_model=List[NewsItem])
async def get_news_for_asset(symbol: str, limit: int = Query(10, ge=1, le=50)):
    """
    Get news related to a specific asset
    """
    symbol = symbol.upper()
    news = []
    
    for item in MOCK_NEWS:
        if symbol in item["relevant_assets"]:
            hours_ago = random.randint(1, 24)
            published = datetime.utcnow() - timedelta(hours=hours_ago)
            
            news.append(NewsItem(
                id=item["id"],
                title=item["title"],
                description=item["description"],
                source=item["source"],
                url=f"https://example.com/news/{item['id']}",
                published_at=published.isoformat(),
                sentiment=item["sentiment"],
                sentiment_score=item["sentiment_score"],
                relevant_assets=item["relevant_assets"],
                ai_summary=item["ai_summary"]
            ))
    
    return news[:limit]


@router.get("/sources")
async def get_news_sources():
    """
    Get list of news sources
    """
    sources = list(set(item["source"] for item in MOCK_NEWS))
    return {"sources": sources}


@router.get("/sentiment-summary")
async def get_sentiment_summary(asset: Optional[str] = None):
    """
    Get aggregated sentiment summary
    """
    filtered = MOCK_NEWS
    if asset:
        filtered = [n for n in MOCK_NEWS if asset.upper() in n["relevant_assets"]]
    
    positive = len([n for n in filtered if n["sentiment"] == "positive"])
    neutral = len([n for n in filtered if n["sentiment"] == "neutral"])
    negative = len([n for n in filtered if n["sentiment"] == "negative"])
    
    avg_score = sum(n["sentiment_score"] for n in filtered) / len(filtered) if filtered else 0
    
    return {
        "total_articles": len(filtered),
        "positive_count": positive,
        "neutral_count": neutral,
        "negative_count": negative,
        "average_sentiment_score": round(avg_score, 2),
        "overall_sentiment": "positive" if positive > negative else "negative" if negative > positive else "neutral"
    }
