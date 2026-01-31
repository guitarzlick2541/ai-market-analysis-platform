"""
Signal Engine - Combines Price Prediction + Sentiment for Final Trading Signal
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum
import numpy as np


class SignalAction(Enum):
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"


class TrendDirection(Enum):
    UP = "UP"
    DOWN = "DOWN"
    SIDEWAYS = "SIDEWAYS"


class RiskLevel(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


@dataclass
class TradingSignal:
    """Trading signal output"""
    asset: str
    signal: SignalAction
    confidence: float
    trend: TrendDirection
    risk_level: RiskLevel
    predicted_price: float
    predicted_range: Dict[str, float]
    feature_importance: List[Dict]
    reasoning: str
    
    def to_dict(self) -> Dict:
        return {
            "asset": self.asset,
            "signal": self.signal.value,
            "confidence": self.confidence,
            "trend": self.trend.value,
            "risk_level": self.risk_level.value,
            "predicted_price": self.predicted_price,
            "predicted_range": self.predicted_range,
            "feature_importance": self.feature_importance,
            "reasoning": self.reasoning
        }


class SignalEngine:
    """
    Combines TFT/LSTM predictions with FinBERT sentiment
    to generate actionable trading signals.
    
    Weighting scheme:
    - Price prediction model: 60%
    - Sentiment analysis: 30%
    - Technical confirmation: 10%
    """
    
    def __init__(
        self,
        price_weight: float = 0.6,
        sentiment_weight: float = 0.3,
        technical_weight: float = 0.1
    ):
        self.price_weight = price_weight
        self.sentiment_weight = sentiment_weight
        self.technical_weight = technical_weight
    
    def generate_signal(
        self,
        asset: str,
        price_prediction: Dict,
        sentiment: Dict,
        technical_indicators: Optional[Dict] = None
    ) -> TradingSignal:
        """
        Generate combined trading signal
        
        Args:
            asset: Asset symbol
            price_prediction: Output from TFT/LSTM model
            sentiment: Output from FinBERT analysis
            technical_indicators: Optional additional technical data
            
        Returns:
            TradingSignal with combined analysis
        """
        # Extract components
        price_signal = self._normalize_signal(price_prediction.get("signal", "HOLD"))
        price_confidence = price_prediction.get("confidence", 50) / 100
        price_trend = price_prediction.get("trend", "SIDEWAYS")
        
        sentiment_label = sentiment.get("sentiment", "neutral")
        sentiment_score = sentiment.get("confidence", 0.5)
        
        # Calculate weighted scores
        # Price signal: BUY=1, HOLD=0, SELL=-1
        price_score = {"BUY": 1, "HOLD": 0, "SELL": -1}.get(price_signal, 0)
        price_score *= price_confidence
        
        # Sentiment score: positive=1, neutral=0, negative=-1
        sentiment_direction = {"positive": 1, "neutral": 0, "negative": -1}.get(sentiment_label, 0)
        sentiment_contribution = sentiment_direction * sentiment_score
        
        # Technical confirmation (if provided)
        technical_score = 0
        if technical_indicators:
            rsi = technical_indicators.get("rsi", 50)
            if rsi < 30:
                technical_score = 0.5  # Oversold = bullish
            elif rsi > 70:
                technical_score = -0.5  # Overbought = bearish
        
        # Combined weighted score
        combined_score = (
            price_score * self.price_weight +
            sentiment_contribution * self.sentiment_weight +
            technical_score * self.technical_weight
        )
        
        # Determine final signal
        if combined_score > 0.2:
            final_signal = SignalAction.BUY
            final_trend = TrendDirection.UP
        elif combined_score < -0.2:
            final_signal = SignalAction.SELL
            final_trend = TrendDirection.DOWN
        else:
            final_signal = SignalAction.HOLD
            final_trend = TrendDirection.SIDEWAYS
        
        # Calculate confidence
        final_confidence = min(95, 50 + abs(combined_score) * 60)
        
        # Assess risk
        risk_level = self._assess_combined_risk(
            price_prediction.get("risk_level", "MEDIUM"),
            sentiment,
            technical_indicators
        )
        
        # Combine feature importance
        feature_importance = self._combine_feature_importance(
            price_prediction.get("feature_importance", []),
            sentiment_score
        )
        
        # Generate reasoning
        reasoning = self._generate_reasoning(
            final_signal,
            price_signal,
            sentiment_label,
            sentiment_score,
            technical_indicators
        )
        
        return TradingSignal(
            asset=asset,
            signal=final_signal,
            confidence=round(final_confidence, 1),
            trend=final_trend,
            risk_level=risk_level,
            predicted_price=price_prediction.get("predicted_price", 0),
            predicted_range=price_prediction.get("predicted_range", {"low": 0, "high": 0}),
            feature_importance=feature_importance,
            reasoning=reasoning
        )
    
    def _normalize_signal(self, signal: str) -> str:
        """Normalize signal string"""
        signal = signal.upper()
        if signal in ["BUY", "SELL", "HOLD"]:
            return signal
        return "HOLD"
    
    def _assess_combined_risk(
        self,
        price_risk: str,
        sentiment: Dict,
        technical: Optional[Dict]
    ) -> RiskLevel:
        """Assess combined risk level"""
        risk_scores = {"LOW": 1, "MEDIUM": 2, "HIGH": 3}
        
        base_risk = risk_scores.get(price_risk.upper(), 2)
        
        # High sentiment uncertainty increases risk
        sentiment_spread = abs(
            sentiment.get("scores", {}).get("positive", 0.33) -
            sentiment.get("scores", {}).get("negative", 0.33)
        )
        if sentiment_spread < 0.2:
            base_risk += 0.5  # Mixed sentiment = higher risk
        
        # Technical divergence increases risk
        if technical:
            rsi = technical.get("rsi", 50)
            if rsi < 20 or rsi > 80:
                base_risk += 0.5  # Extreme conditions
        
        if base_risk >= 2.5:
            return RiskLevel.HIGH
        elif base_risk >= 1.5:
            return RiskLevel.MEDIUM
        return RiskLevel.LOW
    
    def _combine_feature_importance(
        self,
        price_features: List[Dict],
        sentiment_weight: float
    ) -> List[Dict]:
        """Combine feature importance from all sources"""
        # Start with price model features
        features = {f["name"]: f["value"] for f in price_features}
        
        # Ensure sentiment is weighted appropriately
        if "Sentiment Score" not in features:
            features["Sentiment Score"] = self.sentiment_weight * sentiment_weight
        
        # Normalize to sum to 1
        total = sum(features.values())
        normalized = [
            {"name": name, "value": round(value / total, 2)}
            for name, value in features.items()
        ]
        
        # Sort by importance
        normalized.sort(key=lambda x: x["value"], reverse=True)
        
        return normalized[:6]  # Top 6 features
    
    def _generate_reasoning(
        self,
        final_signal: SignalAction,
        price_signal: str,
        sentiment_label: str,
        sentiment_score: float,
        technical: Optional[Dict]
    ) -> str:
        """Generate human-readable reasoning"""
        parts = []
        
        # Price model contribution
        if price_signal == final_signal.value:
            parts.append(f"Price prediction model suggests {price_signal}")
        else:
            parts.append(f"Price model shows {price_signal} but signal adjusted")
        
        # Sentiment contribution
        strength = "strong" if sentiment_score > 0.7 else "moderate" if sentiment_score > 0.5 else "weak"
        parts.append(f"{strength} {sentiment_label} market sentiment ({sentiment_score:.0%} confidence)")
        
        # Technical confirmation
        if technical:
            rsi = technical.get("rsi", 50)
            if rsi < 30:
                parts.append("RSI indicates oversold conditions")
            elif rsi > 70:
                parts.append("RSI indicates overbought conditions")
        
        base = f"Signal: {final_signal.value}. "
        return base + ". ".join(parts) + "."


# ===== Example Usage =====
if __name__ == "__main__":
    engine = SignalEngine()
    
    # Mock inputs
    price_prediction = {
        "signal": "BUY",
        "confidence": 75,
        "trend": "UP",
        "risk_level": "MEDIUM",
        "predicted_price": 44500,
        "predicted_range": {"low": 42500, "high": 46500},
        "feature_importance": [
            {"name": "Volume", "value": 0.25},
            {"name": "RSI", "value": 0.20},
            {"name": "MACD", "value": 0.18},
            {"name": "Momentum", "value": 0.15}
        ]
    }
    
    sentiment = {
        "sentiment": "positive",
        "confidence": 0.82,
        "scores": {
            "positive": 0.82,
            "neutral": 0.12,
            "negative": 0.06
        }
    }
    
    technical = {"rsi": 45, "macd": 120}
    
    signal = engine.generate_signal(
        asset="BTC-USD",
        price_prediction=price_prediction,
        sentiment=sentiment,
        technical_indicators=technical
    )
    
    print("=" * 60)
    print("Signal Engine Demo")
    print("=" * 60)
    result = signal.to_dict()
    for key, value in result.items():
        print(f"{key}: {value}")
