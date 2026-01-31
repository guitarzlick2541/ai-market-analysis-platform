"""
AI Market Analysis Platform - FastAPI Backend
Main entry point with CORS, middleware, and router registration
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from contextlib import asynccontextmanager

# Import routers
from src.api import auth, market, ai, watchlist, news, monitor
from src.websocket import market_ws
import logging
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

# Setup Logging for Monitoring
# Add WebSocket handler to root logger
ws_handler = monitor.WebSocketLogHandler()
ws_handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(message)s')
ws_handler.setFormatter(formatter)
logging.getLogger().addHandler(ws_handler)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logging.info("🚀 Starting AI Market Analysis Platform Backend...")
    logging.info("📊 Initializing market data connections...")
    logging.info("🤖 Loading AI models...")
    yield
    # Shutdown
    logging.info("👋 Shutting down...")


# Custom Middleware for Request Logging
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Process request
        try:
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000
            
            # Log the request details
            status_code = response.status_code
            log_level = logging.INFO if status_code < 400 else logging.WARNING if status_code < 500 else logging.ERROR
            
            logging.log(
                log_level, 
                f"{request.method} {request.url.path} - {status_code} ({process_time:.2f}ms)"
            )
            
            return response
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logging.error(f"{request.method} {request.url.path} - 500 Internal Server Error ({process_time:.2f}ms) - {str(e)}")
            raise e

# Create FastAPI application
app = FastAPI(
    title="AI Market Analysis Platform",
    description="Real-time market analysis API with FinBERT sentiment and TFT/LSTM predictions",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allow_origins = [origin.strip() for origin in origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Logging Middleware (Must be after CORS)
app.add_middleware(RequestLoggingMiddleware)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(market.router, prefix="/api/market", tags=["Market Data"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Predictions"])
app.include_router(watchlist.router, prefix="/api/watchlist", tags=["Watchlist"])
app.include_router(monitor.router, prefix="/api/monitor", tags=["System Monitoring"])
# app.include_router(news.router, prefix="/api/news", tags=["News & Sentiment"])  # Deprecated: Use /api/market/news instead

# WebSocket endpoint
app.include_router(market_ws.router, tags=["WebSocket"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Market Analysis Platform",
        "version": "1.0.0"
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "api": "running",
            "database": "connected",
            "ai_models": "loaded",
            "websocket": "ready"
        }
    }


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "message": str(exc)
        }
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
