"""
AI Service - Main Entry Point
FastAPI server for AI model inference
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

from models.finbert.sentiment import FinBERTSentiment
from models.tft.predictor import TemporalFusionTransformer
from models.lstm.predictor import LSTMPredictor
from services.signal_engine import SignalEngine

# Initialize FastAPI
app = FastAPI(
    title="AI Market Analysis - Model Service",
    description="FinBERT sentiment analysis and TFT/LSTM price prediction",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models (lazy loading)
finbert = None
tft_model = None
lstm_model = None
signal_engine = SignalEngine()


def get_finbert():
    global finbert
    if finbert is None:
        finbert = FinBERTSentiment()
    return finbert


def get_tft():
    global tft_model
    if tft_model is None:
        tft_model = TemporalFusionTransformer()
    return tft_model


def get_lstm():
    global lstm_model
    if lstm_model is None:
        lstm_model = LSTMPredictor()
    return lstm_model


# ===== Request/Response Models =====

class SentimentRequest(BaseModel):
    text: str

class SentimentBatchRequest(BaseModel):
    texts: List[str]

class PredictionRequest(BaseModel):
    asset: str
    features: Optional[List[List[float]]] = None
    sentiment_score: float = 0.5

class SignalRequest(BaseModel):
    asset: str
    price_prediction: dict
    sentiment: dict
    technical_indicators: Optional[dict] = None


# ===== Routes =====

@app.get("/")
async def root():
    return {
        "service": "AI Market Analysis - Model Service",
        "status": "healthy",
        "models": ["FinBERT", "TFT", "LSTM"]
    }


@app.post("/sentiment")
async def analyze_sentiment(request: SentimentRequest):
    """Analyze sentiment using FinBERT"""
    try:
        model = get_finbert()
        result = model.analyze(request.text)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sentiment/batch")
async def analyze_sentiment_batch(request: SentimentBatchRequest):
    """Analyze multiple texts"""
    try:
        model = get_finbert()
        results = model.analyze_batch(request.texts)
        aggregated = model.get_aggregated_sentiment(request.texts)
        return {
            "success": True,
            "data": {
                "results": results,
                "aggregated": aggregated
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/tft")
async def predict_tft(request: PredictionRequest):
    """Price prediction using TFT model"""
    try:
        model = get_tft()
        # In production: prepare features from real data
        import numpy as np
        mock_features = np.random.randn(100, 10)
        result = model.predict(mock_features, request.sentiment_score)
        result["asset"] = request.asset
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/lstm")
async def predict_lstm(request: PredictionRequest):
    """Price prediction using LSTM model"""
    try:
        model = get_lstm()
        import numpy as np
        mock_features = np.random.randn(60, 10)
        result = model.predict(mock_features, request.sentiment_score)
        result["asset"] = request.asset
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/signal")
async def generate_signal(request: SignalRequest):
    """Generate combined trading signal"""
    try:
        signal = signal_engine.generate_signal(
            asset=request.asset,
            price_prediction=request.price_prediction,
            sentiment=request.sentiment,
            technical_indicators=request.technical_indicators
        )
        return {"success": True, "data": signal.to_dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/models/info")
async def get_model_info():
    """Get information about loaded models"""
    return {
        "finbert": {
            "name": "FinBERT",
            "source": "ProsusAI/finbert",
            "task": "Financial Sentiment Analysis",
            "labels": ["positive", "neutral", "negative"]
        },
        "tft": {
            "name": "Temporal Fusion Transformer",
            "task": "Multi-horizon Price Prediction",
            "features": 10,
            "horizon": "24 hours"
        },
        "lstm": {
            "name": "LSTM",
            "task": "Price Direction Prediction",
            "layers": 2,
            "fallback": True
        },
        "signal_engine": {
            "weights": {
                "price": 0.6,
                "sentiment": 0.3,
                "technical": 0.1
            }
        }
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
