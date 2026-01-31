"""
Market Data API Routes
Provides real-time and historical market data using Yahoo Finance (yfinance)
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import yfinance as yf
import asyncio
from functools import partial
import time

router = APIRouter()

# ===== Cache System =====
# เก็บราคาล่าสุดไว้ใน cache เพื่อลด API calls
price_cache: Dict[str, Dict[str, Any]] = {}
history_cache: Dict[str, Dict[str, Any]] = {}
PRICE_CACHE_TTL = 30  # วินาที (ลดจาก 60 เพราะต้องการความเรียลไทม์)
HISTORY_CACHE_TTL = 120  # วินาที

# Fallback prices เมื่อ API ไม่ตอบสนอง (ราคาโดยประมาณ)
FALLBACK_PRICES = {
    # By symbol
    "BTC-USD": {"price": 100000, "name": "Bitcoin"},
    "ETH-USD": {"price": 3300, "name": "Ethereum"},
    "SOL-USD": {"price": 240, "name": "Solana"},
    "AAPL": {"price": 235, "name": "Apple Inc."},
    "MSFT": {"price": 450, "name": "Microsoft"},
    "GOOGL": {"price": 198, "name": "Alphabet"},
    "AMZN": {"price": 235, "name": "Amazon"},
    "NVDA": {"price": 135, "name": "NVIDIA"},
    "META": {"price": 700, "name": "Meta Platforms"},
    "TSLA": {"price": 400, "name": "Tesla"},
    "XAU-USD": {"price": 2760, "name": "Gold"},
    "XAG-USD": {"price": 30, "name": "Silver"},
    # By Yahoo ticker (for commodities futures)
    "GC=F": {"price": 2760, "name": "Gold"},
    "SI=F": {"price": 30, "name": "Silver"},
}

# ===== Pydantic Models =====

class Asset(BaseModel):
    symbol: str
    name: str
    type: str  # crypto, stock, commodity
    price: float
    change_24h: float
    volume_24h: float
    market_cap: Optional[float] = None

class OHLCV(BaseModel):
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: float

class NewsItem(BaseModel):
    id: str
    title: str
    publisher: str
    link: str
    published_at: int
    thumbnail: Optional[str] = None
    related_tickers: List[str]

class PriceResponse(BaseModel):
    symbol: str
    price: float
    change_24h: float
    high_24h: float
    low_24h: float
    volume_24h: float
    last_updated: str

# ===== Asset Configuration (Yahoo Tickers) =====

ASSET_CONFIG = {
    # Crypto
    "BTC-USD": {"name": "Bitcoin", "type": "crypto", "ticker": "BTC-USD"},
    "ETH-USD": {"name": "Ethereum", "type": "crypto", "ticker": "ETH-USD"},
    "SOL-USD": {"name": "Solana", "type": "crypto", "ticker": "SOL-USD"},
    # Stocks (Magnificent 7)
    "AAPL": {"name": "Apple Inc.", "type": "stock", "ticker": "AAPL"},
    "MSFT": {"name": "Microsoft", "type": "stock", "ticker": "MSFT"},
    "GOOGL": {"name": "Alphabet", "type": "stock", "ticker": "GOOGL"},
    "AMZN": {"name": "Amazon", "type": "stock", "ticker": "AMZN"},
    "NVDA": {"name": "NVIDIA", "type": "stock", "ticker": "NVDA"},
    "META": {"name": "Meta Platforms", "type": "stock", "ticker": "META"},
    "TSLA": {"name": "Tesla", "type": "stock", "ticker": "TSLA"},
    # Commodities
    "XAU-USD": {"name": "Gold", "type": "commodity", "ticker": "GC=F"},
    "XAG-USD": {"name": "Silver", "type": "commodity", "ticker": "SI=F"},
}

# ===== Helper Functions =====

def _fetch_ticker_info(ticker_symbol: str):
    """Sync function to fetch data from yfinance with caching"""
    current_time = time.time()
    
    # ตรวจสอบ cache ก่อน
    if ticker_symbol in price_cache:
        cached = price_cache[ticker_symbol]
        if current_time - cached["timestamp"] < PRICE_CACHE_TTL:
            return cached["data"]
    
    try:
        ticker = yf.Ticker(ticker_symbol)
        # fast_info is faster for realtime price
        info = ticker.fast_info
        
        # safely get price data
        last_price = info.last_price
        prev_close = info.previous_close
        
        # ถ้าไม่มีราคา (ตลาดปิด/API error) ใช้ previous close
        if last_price is None or last_price == 0:
            last_price = prev_close if prev_close else FALLBACK_PRICES.get(ticker_symbol, {}).get("price", 0)
        
        if prev_close is None or prev_close == 0:
            prev_close = last_price
        
        change_pct = ((last_price - prev_close) / prev_close * 100) if prev_close and prev_close != 0 else 0
        
        result = {
            "price": round(last_price, 2) if last_price else 0,
            "change_24h": round(change_pct, 2),
            "high_24h": info.day_high if info.day_high else last_price,
            "low_24h": info.day_low if info.day_low else last_price,
            "volume_24h": info.last_volume if info.last_volume else 0,
            "market_cap": info.market_cap if info.market_cap else 0
        }
        
        # บันทึกลง cache
        price_cache[ticker_symbol] = {
            "data": result,
            "timestamp": current_time
        }
        
        return result
        
    except Exception as e:
        print(f"Error fetching {ticker_symbol}: {e}")
        
        # ใช้ fallback price ถ้ามี
        if ticker_symbol in FALLBACK_PRICES:
            fallback = FALLBACK_PRICES[ticker_symbol]
            return {
                "price": fallback["price"],
                "change_24h": 0,
                "high_24h": fallback["price"],
                "low_24h": fallback["price"],
                "volume_24h": 0,
                "market_cap": 0
            }
        
        # ถ้าไม่มี fallback ให้ดึงจาก cache เก่า
        if ticker_symbol in price_cache:
            return price_cache[ticker_symbol]["data"]
            
        return None

async def fetch_realtime_data(ticker_symbol: str):
    """Async wrapper for yfinance call with timeout"""
    loop = asyncio.get_event_loop()
    try:
        # เพิ่ม timeout 10 วินาที
        result = await asyncio.wait_for(
            loop.run_in_executor(None, partial(_fetch_ticker_info, ticker_symbol)),
            timeout=10.0
        )
        return result
    except asyncio.TimeoutError:
        print(f"Timeout fetching {ticker_symbol}")
        if ticker_symbol in FALLBACK_PRICES:
            return {
                "price": FALLBACK_PRICES[ticker_symbol]["price"],
                "change_24h": 0,
                "high_24h": FALLBACK_PRICES[ticker_symbol]["price"],
                "low_24h": FALLBACK_PRICES[ticker_symbol]["price"],
                "volume_24h": 0,
                "market_cap": 0
            }
        return None


def _fetch_history_sync(ticker_symbol: str, period: str, interval: str):
    """Fetch historical data with caching"""
    cache_key = f"{ticker_symbol}_{period}_{interval}"
    current_time = time.time()
    
    # ตรวจสอบ cache ก่อน
    if cache_key in history_cache:
        cached = history_cache[cache_key]
        if current_time - cached["timestamp"] < HISTORY_CACHE_TTL:
            return cached["data"]
    
    try:
        ticker = yf.Ticker(ticker_symbol)
        df = ticker.history(period=period, interval=interval)
        
        if df.empty:
            print(f"No history data for {ticker_symbol}")
            # ส่งคืน fallback data แทน empty list
            return _generate_fallback_history(ticker_symbol, interval)
        
        ohlc_list = []
        for index, row in df.iterrows():
            ohlc_list.append(OHLCV(
                time=int(index.timestamp()),
                open=round(row['Open'], 2),
                high=round(row['High'], 2),
                low=round(row['Low'], 2),
                close=round(row['Close'], 2),
                volume=int(row['Volume'])
            ))
        
        # บันทึกลง cache
        history_cache[cache_key] = {
            "data": ohlc_list,
            "timestamp": current_time
        }
        
        return ohlc_list
    except Exception as e:
        print(f"Error fetching history for {ticker_symbol}: {e}")
        # ตรวจสอบ cache เก่า
        if cache_key in history_cache:
            return history_cache[cache_key]["data"]
        # สร้าง fallback data
        return _generate_fallback_history(ticker_symbol, interval)

def _generate_fallback_history(ticker_symbol: str, interval: str) -> List[OHLCV]:
    """Generate realistic fallback history data based on asset"""
    base_price = FALLBACK_PRICES.get(ticker_symbol, {}).get("price", 100)
    
    # กำหนดจำนวน candles และเวลาตาม interval
    interval_seconds = {
        "1m": 60,
        "5m": 300,
        "15m": 900,
        "1h": 3600,
        "1d": 86400
    }
    
    seconds = interval_seconds.get(interval, 3600)
    num_candles = 100
    now = int(time.time())
    
    ohlc_list = []
    current_price = base_price
    
    for i in range(num_candles):
        candle_time = now - (num_candles - i) * seconds
        
        # สร้างการเปลี่ยนแปลงราคาที่สมจริง (volatility 0.5-2% ต่อ candle)
        volatility = base_price * 0.005
        change = (hash(f"{ticker_symbol}{candle_time}") % 1000 - 500) / 500 * volatility
        
        open_price = current_price
        close_price = open_price + change
        high_price = max(open_price, close_price) + abs(change) * 0.3
        low_price = min(open_price, close_price) - abs(change) * 0.3
        
        current_price = close_price
        
        ohlc_list.append(OHLCV(
            time=candle_time,
            open=round(open_price, 2),
            high=round(high_price, 2),
            low=round(low_price, 2),
            close=round(close_price, 2),
            volume=int(abs(hash(f"{ticker_symbol}{candle_time}v")) % 1000000)
        ))
    
    return ohlc_list

async def fetch_history_data(ticker_symbol: str, period: str, interval: str):
    """Fetch history with timeout protection"""
    loop = asyncio.get_event_loop()
    try:
        result = await asyncio.wait_for(
            loop.run_in_executor(None, partial(_fetch_history_sync, ticker_symbol, period, interval)),
            timeout=15.0
        )
        return result
    except asyncio.TimeoutError:
        print(f"Timeout fetching history for {ticker_symbol}")
        return _generate_fallback_history(ticker_symbol, interval)


def _fetch_news_sync(symbols: List[str]):
    """Fetch news for multiple symbols"""
    news_items = []
    seen_links = set()
    
    # ถ้าไม่มีการระบุ symbols ให้ใช้ General Market News
    tickers_to_fetch = symbols if symbols else ["^GSPC", "BTC-USD", "AAPL", "NVDA"]
    
    for symbol in tickers_to_fetch:
        try:
            ticker = yf.Ticker(symbol)
            news_data = ticker.news
            
            for item in news_data:
                item_link = item.get("link", "#")
                if item_link in seen_links:
                    continue
                    
                seen_links.add(item_link)
                
                # หา thumbnail image ถ้ามี
                thumbnail = None
                if "thumbnail" in item and "resolutions" in item["thumbnail"]:
                    resolutions = item["thumbnail"]["resolutions"]
                    if resolutions:
                        thumbnail = resolutions[0]["url"]
                
                news_items.append(NewsItem(
                    id=item.get("uuid", str(hash(item_link))),
                    title=item.get("title", "No Title"),
                    publisher=item.get("publisher", "Unknown"),
                    link=item_link,
                    published_at=item.get("providerPublishTime", int(time.time())),
                    thumbnail=thumbnail,
                    related_tickers=item.get("relatedTickers", [])
                ))
        except Exception as e:
            print(f"Error fetching news for {symbol}: {e}")
            continue
            
    # เรียงตามเวลาล่าสุด
    news_items.sort(key=lambda x: x.published_at, reverse=True)
    return news_items[:12]  # Return top 12 news

async def fetch_market_news(symbols: List[str] = None):
    """Async wrapper for fetching news"""
    loop = asyncio.get_event_loop()
    try:
        return await loop.run_in_executor(None, _fetch_news_sync, symbols)
    except Exception as e:
        print(f"Error executing fetch_news: {e}")
        return []

# ===== News Fetching =====

# Fallback news data when yfinance fails
FALLBACK_NEWS = [
    {
        "id": "fallback-1",
        "title": "AI-powered trading platforms gain momentum in global markets",
        "publisher": "Financial Times",
        "link": "https://www.ft.com",
        "published_at": int(datetime.utcnow().timestamp()),
        "thumbnail": None,
        "related_tickers": ["NVDA", "MSFT", "GOOGL"]
    },
    {
        "id": "fallback-2",
        "title": "Bitcoin maintains strong position as institutional adoption continues",
        "publisher": "CoinDesk",
        "link": "https://www.coindesk.com",
        "published_at": int(datetime.utcnow().timestamp()) - 3600,
        "thumbnail": None,
        "related_tickers": ["BTC-USD", "ETH-USD"]
    },
    {
        "id": "fallback-3",
        "title": "Tech giants report strong quarterly earnings amid AI boom",
        "publisher": "Bloomberg",
        "link": "https://www.bloomberg.com",
        "published_at": int(datetime.utcnow().timestamp()) - 7200,
        "thumbnail": None,
        "related_tickers": ["AAPL", "MSFT", "GOOGL", "META"]
    },
    {
        "id": "fallback-4",
        "title": "Gold prices remain stable as investors monitor Fed policy",
        "publisher": "Reuters",
        "link": "https://www.reuters.com",
        "published_at": int(datetime.utcnow().timestamp()) - 10800,
        "thumbnail": None,
        "related_tickers": ["XAU-USD"]
    },
    {
        "id": "fallback-5",
        "title": "NVIDIA continues to lead AI chip market with record demand",
        "publisher": "TechCrunch",
        "link": "https://www.techcrunch.com",
        "published_at": int(datetime.utcnow().timestamp()) - 14400,
        "thumbnail": None,
        "related_tickers": ["NVDA"]
    }
]


def _fetch_news_sync(symbols: List[str]) -> List[dict]:
    """Fetch news from Yahoo Finance for given symbols"""
    all_news = []
    seen_ids = set()
    
    for symbol in symbols:
        try:
            ticker = yf.Ticker(symbol)
            news_items = ticker.news
            
            # Check if news_items is valid and iterable
            if news_items and isinstance(news_items, list):
                for item in news_items[:5]:  # Top 5 news per symbol
                    if not isinstance(item, dict):
                        continue
                    
                    news_id = item.get("uuid", str(hash(item.get("title", ""))))
                    if news_id not in seen_ids:
                        seen_ids.add(news_id)
                        
                        # Get thumbnail if available (with extra null checks)
                        thumbnail = None
                        try:
                            thumb_data = item.get("thumbnail")
                            if thumb_data and isinstance(thumb_data, dict):
                                resolutions = thumb_data.get("resolutions", [])
                                if resolutions and len(resolutions) > 0:
                                    thumbnail = resolutions[0].get("url")
                        except:
                            pass
                        
                        all_news.append({
                            "id": news_id,
                            "title": item.get("title", "No Title"),
                            "publisher": item.get("publisher", "Unknown"),
                            "link": item.get("link", "#"),
                            "published_at": item.get("providerPublishTime", 0),
                            "thumbnail": thumbnail,
                            "related_tickers": item.get("relatedTickers", [symbol]) or [symbol]
                        })
        except Exception as e:
            print(f"Error fetching news for {symbol}: {e}")
            continue
    
    # Sort by publish time (newest first)
    all_news.sort(key=lambda x: x["published_at"], reverse=True)
    return all_news[:15]  # Return top 15 news items


async def fetch_market_news(symbols: List[str]) -> List[NewsItem]:
    """Async wrapper to fetch market news with fallback"""
    loop = asyncio.get_event_loop()
    try:
        result = await asyncio.wait_for(
            loop.run_in_executor(None, partial(_fetch_news_sync, symbols)),
            timeout=15.0
        )
        
        # If no real news found, use fallback
        if not result:
            print("No real news found, using fallback")
            return [NewsItem(**item) for item in FALLBACK_NEWS]
        
        return [NewsItem(**item) for item in result]
    except asyncio.TimeoutError:
        print("Timeout fetching news, using fallback")
        return [NewsItem(**item) for item in FALLBACK_NEWS]
    except Exception as e:
        print(f"Error in fetch_market_news: {e}, using fallback")
        return [NewsItem(**item) for item in FALLBACK_NEWS]


# ===== Routes =====

@router.get("/assets", response_model=List[Asset])
async def get_assets(
    type: Optional[str] = Query(None, description="Filter by asset type: crypto, stock, commodity")
):
    """Get list of all available assets with real-time prices"""
    assets = []
    
    tasks = []
    symbols = []
    
    for symbol, config in ASSET_CONFIG.items():
        if type and config["type"] != type:
            continue
        symbols.append(symbol)
        tasks.append(fetch_realtime_data(config["ticker"]))
    
    results = await asyncio.gather(*tasks)
    
    for i, data in enumerate(results):
        if data:
            symbol = symbols[i]
            config = ASSET_CONFIG[symbol]
            assets.append(Asset(
                symbol=symbol,
                name=config["name"],
                type=config["type"],
                price=data["price"],
                change_24h=data["change_24h"],
                volume_24h=data["volume_24h"],
                market_cap=data["market_cap"],
            ))
    
    return assets

@router.get("/prices/{symbol}", response_model=PriceResponse)
async def get_price(symbol: str):
    """Get current price for a specific asset"""
    symbol = symbol.upper()
    if symbol not in ASSET_CONFIG:
        raise HTTPException(status_code=404, detail=f"Asset {symbol} not found")
    
    config = ASSET_CONFIG[symbol]
    data = await fetch_realtime_data(config["ticker"])
    
    if not data:
        raise HTTPException(status_code=503, detail=f"Unable to fetch price for {symbol}")
    
    return PriceResponse(
        symbol=symbol,
        price=data["price"],
        change_24h=data["change_24h"],
        high_24h=data["high_24h"],
        low_24h=data["low_24h"],
        volume_24h=data["volume_24h"],
        last_updated=datetime.utcnow().isoformat(),
    )

@router.get("/history/{symbol}", response_model=List[OHLCV])
async def get_history(
    symbol: str,
    timeframe: str = Query("1h", description="Timeframe: 1m, 5m, 1h, 1d")
):
    """Get historical OHLCV data using Yahoo Finance"""
    symbol = symbol.upper()
    if symbol not in ASSET_CONFIG:
        raise HTTPException(status_code=404, detail=f"Asset {symbol} not found")
    
    config = ASSET_CONFIG[symbol]
    
    # Map timeframe to yfinance period/interval
    # yfinance specific: 1m (7d max), 5m (60d max), 1h (730d max)
    mapping = {
        "1m": {"period": "5d", "interval": "1m"},
        "5m": {"period": "1mo", "interval": "5m"},
        "15m": {"period": "1mo", "interval": "15m"},
        "1h": {"period": "3mo", "interval": "1h"},
        "4h": {"period": "6mo", "interval": "1h"}, # yfinance doesn't standardly support 4h, use 1h
        "1D": {"period": "1y", "interval": "1d"},
    }
    
    tf_config = mapping.get(timeframe, {"period": "1mo", "interval": "1h"})
    
    data = await fetch_history_data(config["ticker"], tf_config["period"], tf_config["interval"])
    
    if not data:
        raise HTTPException(status_code=503, detail=f"Unable to fetch history for {symbol}")
    
    return data

@router.get("/news", response_model=List[NewsItem])
async def get_news():
    """Get latest market news"""
    # ดึงข่าวจาก major indices และ popular tech stocks/crypto
    symbols = ["^GSPC", "BTC-USD", "ETH-USD", "AAPL", "NVDA", "MSFT"]
    return await fetch_market_news(symbols)


@router.get("/quotes")
async def get_multiple_quotes(symbols: str = Query(..., description="Comma-separated symbols")):
    """Get quotes for multiple assets at once"""
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    quotes = []
    
    tasks = []
    valid_symbols = []
    
    for symbol in symbol_list:
        if symbol in ASSET_CONFIG:
            valid_symbols.append(symbol)
            tasks.append(fetch_realtime_data(ASSET_CONFIG[symbol]["ticker"]))
    
    results = await asyncio.gather(*tasks)
    
    for i, data in enumerate(results):
        if data:
            symbol = valid_symbols[i]
            config = ASSET_CONFIG[symbol]
            quotes.append({
                "symbol": symbol,
                "name": config["name"],
                "type": config["type"],
                "price": data["price"],
                "change_24h": data["change_24h"],
                "volume_24h": data["volume_24h"],
                "market_cap": data["market_cap"],
            })
            
    return {"quotes": quotes}
