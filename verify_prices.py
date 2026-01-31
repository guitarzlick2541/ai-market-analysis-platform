
import yfinance as yf
import time
import json

assets = {
    "BTC-USD": "Crypto",
    "ETH-USD": "Crypto",
    "AAPL": "Stock",
    "XAU-USD": "Gold (Spot/Forex - unreliable in yf)",
    "GC=F": "Gold (Futures)",
    "SI=F": "Silver (Futures)"
}

print(f"{'SYMBOL':<10} | {'TYPE':<15} | {'PRICE':<10} | {'SOURCE':<10} | {'STATUS'}")
print("-" * 65)

for symbol, type_ in assets.items():
    try:
        start = time.time()
        ticker = yf.Ticker(symbol)
        
        # Try different methods to get price
        price = None
        source = "None"
        
        # Method 1: fast_info (Newer, faster)
        if hasattr(ticker, 'fast_info'):
            try:
                price = ticker.fast_info.last_price
                source = "fast_info"
            except:
                pass
        
        # Method 2: history (Fallback)
        if price is None:
             hist = ticker.history(period="1d")
             if not hist.empty:
                 price = hist['Close'].iloc[-1]
                 source = "history"
        
        status = "✅ OK" if price else "❌ FAIL"
        price_str = f"{price:.2f}" if price else "N/A"
        
        print(f"{symbol:<10} | {type_:<15} | {price_str:<10} | {source:<10} | {status}")
        
    except Exception as e:
        print(f"{symbol:<10} | {type_:<15} | {'ERR':<10} | {'ERROR':<10} | ❌ {str(e)}")
