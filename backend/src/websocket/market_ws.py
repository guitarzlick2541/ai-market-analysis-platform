"""
WebSocket Handler for Real-Time Market Data
Provides live price updates and AI signal notifications
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
import asyncio
import json
import random
from datetime import datetime

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections and subscriptions"""
    
    def __init__(self):
        # Active connections: websocket -> set of subscribed symbols
        self.active_connections: Dict[WebSocket, Set[str]] = {}
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[websocket] = set()
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            del self.active_connections[websocket]
    
    def subscribe(self, websocket: WebSocket, symbols: List[str]):
        if websocket in self.active_connections:
            self.active_connections[websocket].update(s.upper() for s in symbols)
    
    def unsubscribe(self, websocket: WebSocket, symbols: List[str]):
        if websocket in self.active_connections:
            for symbol in symbols:
                self.active_connections[websocket].discard(symbol.upper())
    
    async def broadcast_to_subscribers(self, symbol: str, message: dict):
        """Send message to all connections subscribed to this symbol"""
        for websocket, subscriptions in self.active_connections.items():
            if symbol in subscriptions:
                try:
                    await websocket.send_json(message)
                except:
                    pass
    
    async def send_personal(self, websocket: WebSocket, message: dict):
        await websocket.send_json(message)


manager = ConnectionManager()


# ===== Mock Data Generators =====

BASE_PRICES = {
    "BTC-USD": 43250.0,
    "ETH-USD": 2580.0,
    "SOL-USD": 98.0,
    "DOGE-USD": 0.082,
    "AAPL": 185.92,
    "MSFT": 402.56,
    "GOOGL": 141.80,
    "NVDA": 615.27,
    "XAU-USD": 2045.30,
    "XAG-USD": 23.15,
}

current_prices = {k: v for k, v in BASE_PRICES.items()}


def generate_price_update(symbol: str) -> dict:
    """Generate a mock price update"""
    base = BASE_PRICES.get(symbol, 100)
    current = current_prices.get(symbol, base)
    
    # Small random price change
    change = current * random.uniform(-0.001, 0.001)
    new_price = current + change
    current_prices[symbol] = new_price
    
    change_pct = ((new_price - base) / base) * 100
    
    return {
        "type": "price",
        "symbol": symbol,
        "price": round(new_price, 2 if new_price > 1 else 6),
        "change": round(change_pct, 2),
        "volume": random.uniform(1000000, 50000000),
        "timestamp": datetime.utcnow().isoformat()
    }


def generate_signal_update(symbol: str) -> dict:
    """Generate a mock AI signal update"""
    signals = ["BUY", "SELL", "HOLD"]
    signal = random.choices(signals, weights=[0.35, 0.25, 0.4])[0]
    
    return {
        "type": "signal",
        "symbol": symbol,
        "signal": signal,
        "confidence": round(random.uniform(60, 90), 1),
        "trend": "UP" if signal == "BUY" else "DOWN" if signal == "SELL" else "SIDEWAYS",
        "timestamp": datetime.utcnow().isoformat()
    }


# ===== WebSocket Routes =====

@router.websocket("/ws/prices")
async def websocket_prices(websocket: WebSocket):
    """
    WebSocket endpoint for real-time price updates
    
    Client sends:
    - {"action": "subscribe", "symbols": ["BTC-USD", "ETH-USD"]}
    - {"action": "unsubscribe", "symbols": ["BTC-USD"]}
    
    Server sends:
    - {"type": "price", "symbol": "BTC-USD", "price": 43250.50, ...}
    """
    await manager.connect(websocket)
    
    try:
        # Start background task for sending price updates
        async def send_price_updates():
            while True:
                for symbol in list(manager.active_connections.get(websocket, [])):
                    update = generate_price_update(symbol)
                    await manager.broadcast_to_subscribers(symbol, update)
                await asyncio.sleep(1)  # Update every second
        
        update_task = asyncio.create_task(send_price_updates())
        
        # Handle incoming messages
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            symbols = data.get("symbols", [])
            
            if action == "subscribe":
                manager.subscribe(websocket, symbols)
                await manager.send_personal(websocket, {
                    "type": "subscribed",
                    "symbols": symbols
                })
            
            elif action == "unsubscribe":
                manager.unsubscribe(websocket, symbols)
                await manager.send_personal(websocket, {
                    "type": "unsubscribed",
                    "symbols": symbols
                })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)


@router.websocket("/ws/signals")
async def websocket_signals(websocket: WebSocket):
    """
    WebSocket endpoint for real-time AI signal updates
    
    Sends periodic AI signal updates for subscribed assets
    """
    await manager.connect(websocket)
    
    try:
        # Start background task for sending signal updates
        async def send_signal_updates():
            while True:
                for symbol in list(manager.active_connections.get(websocket, [])):
                    # Send signal updates less frequently (every 30 seconds)
                    if random.random() < 0.1:  # ~10% chance each cycle
                        update = generate_signal_update(symbol)
                        await manager.broadcast_to_subscribers(symbol, update)
                await asyncio.sleep(3)
        
        update_task = asyncio.create_task(send_signal_updates())
        
        # Handle incoming messages
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            symbols = data.get("symbols", [])
            
            if action == "subscribe":
                manager.subscribe(websocket, symbols)
                # Send initial signals for subscribed assets
                for symbol in symbols:
                    await manager.send_personal(websocket, generate_signal_update(symbol.upper()))
            
            elif action == "unsubscribe":
                manager.unsubscribe(websocket, symbols)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)
