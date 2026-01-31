"""
AI Service - Temporal Fusion Transformer (TFT) for Price Prediction
Multi-horizon forecasting with interpretable attention mechanism
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass


@dataclass
class TFTConfig:
    """Configuration for TFT model"""
    input_size: int = 10  # Number of input features
    hidden_size: int = 64
    num_heads: int = 4
    num_encoder_layers: int = 2
    num_decoder_layers: int = 2
    dropout: float = 0.1
    prediction_horizon: int = 24  # Hours ahead to predict
    sequence_length: int = 168  # 7 days of hourly data


class TemporalFusionTransformer:
    """
    Temporal Fusion Transformer for multi-horizon price prediction
    
    This is a simplified implementation structure.
    In production, use pytorch_forecasting or custom PyTorch implementation.
    
    Features used:
    - OHLC prices
    - Volume
    - Technical indicators (RSI, MACD, MA)
    - Volatility (ATR)
    - Sentiment score
    - Time features (hour, day, month)
    """
    
    def __init__(self, config: Optional[TFTConfig] = None):
        """Initialize TFT model"""
        self.config = config or TFTConfig()
        self.model = None
        self.scaler = None
        self.is_trained = False
        
        # Feature names for interpretability
        self.feature_names = [
            "close_price",
            "volume",
            "rsi",
            "macd",
            "macd_signal",
            "ma_20",
            "ma_50",
            "volatility",
            "sentiment_score",
            "hour_sin",  # Cyclical time encoding
        ]
    
    def load_model(self, model_path: Optional[str] = None):
        """
        Load pre-trained model weights
        
        In production: Load from saved checkpoint
        """
        print(f"Loading TFT model...")
        # Placeholder: load actual model weights
        self.is_trained = True
        print("TFT model loaded successfully")
    
    def prepare_features(self, data: pd.DataFrame) -> np.ndarray:
        """
        Prepare features from OHLCV data
        
        Args:
            data: DataFrame with columns [open, high, low, close, volume]
            
        Returns:
            Feature array of shape (sequence_length, input_size)
        """
        # Calculate technical indicators
        features = pd.DataFrame()
        
        # Price
        features['close_price'] = data['close']
        
        # Volume
        features['volume'] = data['volume']
        
        # RSI (14-period)
        delta = data['close'].diff()
        gain = delta.where(delta > 0, 0).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        rs = gain / loss
        features['rsi'] = 100 - (100 / (1 + rs))
        
        # MACD
        ema12 = data['close'].ewm(span=12).mean()
        ema26 = data['close'].ewm(span=26).mean()
        features['macd'] = ema12 - ema26
        features['macd_signal'] = features['macd'].ewm(span=9).mean()
        
        # Moving Averages
        features['ma_20'] = data['close'].rolling(20).mean()
        features['ma_50'] = data['close'].rolling(50).mean()
        
        # Volatility (ATR approximation)
        high_low = data['high'] - data['low']
        features['volatility'] = high_low.rolling(14).mean()
        
        # Sentiment (placeholder - should come from FinBERT)
        features['sentiment_score'] = 0.5  # Neutral default
        
        # Time features (cyclical encoding)
        features['hour_sin'] = np.sin(2 * np.pi * pd.to_datetime(data.index).hour / 24)
        
        # Handle NaN values
        features = features.fillna(method='ffill').fillna(0)
        
        return features.values
    
    def predict(
        self, 
        features: np.ndarray,
        sentiment_score: float = 0.5
    ) -> Dict:
        """
        Generate price prediction
        
        Args:
            features: Prepared feature array
            sentiment_score: Current sentiment score from FinBERT
            
        Returns:
            Prediction dict with trend, confidence, signal, etc.
        """
        # Mock prediction logic
        # In production: Run actual TFT model inference
        
        last_price = features[-1, 0]  # Last close price
        
        # Simulate prediction based on features
        rsi = features[-1, 2]
        macd = features[-1, 3]
        
        # Simple rule-based mock (replace with actual model output)
        trend_score = 0.0
        
        # RSI contribution
        if rsi < 30:  # Oversold
            trend_score += 0.3
        elif rsi > 70:  # Overbought
            trend_score -= 0.3
        
        # MACD contribution
        trend_score += 0.2 if macd > 0 else -0.2
        
        # Sentiment contribution
        trend_score += (sentiment_score - 0.5) * 0.4
        
        # Determine trend
        if trend_score > 0.15:
            trend = "UP"
            signal = "BUY"
        elif trend_score < -0.15:
            trend = "DOWN"
            signal = "SELL"
        else:
            trend = "SIDEWAYS"
            signal = "HOLD"
        
        # Confidence based on feature alignment
        confidence = min(90, 50 + abs(trend_score) * 100)
        
        # Price prediction
        change_pct = trend_score * 0.05  # 5% max change
        predicted_price = last_price * (1 + change_pct)
        
        # Feature importance (mock attention weights)
        feature_importance = self._calculate_feature_importance(features)
        
        return {
            "trend": trend,
            "signal": signal,
            "confidence": round(confidence, 1),
            "predicted_price": round(predicted_price, 2),
            "predicted_range": {
                "low": round(last_price * 0.95, 2),
                "high": round(last_price * 1.08, 2)
            },
            "risk_level": self._assess_risk(features),
            "feature_importance": feature_importance,
            "reasoning": self._generate_reasoning(trend, signal, rsi, macd, sentiment_score)
        }
    
    def _calculate_feature_importance(self, features: np.ndarray) -> List[Dict]:
        """Calculate feature importance from attention weights"""
        # Mock attention-based importance
        # In production: Extract from model's attention mechanism
        
        importance = [
            ("Sentiment Score", 0.25),
            ("Volume Change", 0.20),
            ("RSI", 0.18),
            ("MACD Signal", 0.15),
            ("Price Momentum", 0.12),
            ("Volatility", 0.10),
        ]
        
        return [{"name": name, "value": value} for name, value in importance]
    
    def _assess_risk(self, features: np.ndarray) -> str:
        """Assess risk level based on volatility and conditions"""
        volatility = features[-1, 7]  # ATR
        rsi = features[-1, 2]
        
        # High risk conditions
        if volatility > np.mean(features[:, 7]) * 1.5:
            return "HIGH"
        if rsi < 20 or rsi > 80:
            return "HIGH"
        if volatility > np.mean(features[:, 7]) * 1.2:
            return "MEDIUM"
        return "LOW"
    
    def _generate_reasoning(
        self,
        trend: str,
        signal: str,
        rsi: float,
        macd: float,
        sentiment: float
    ) -> str:
        """Generate human-readable reasoning for the prediction"""
        reasons = []
        
        # RSI analysis
        if rsi < 30:
            reasons.append("RSI indicates oversold conditions")
        elif rsi > 70:
            reasons.append("RSI indicates overbought conditions")
        else:
            reasons.append("RSI in neutral zone")
        
        # MACD analysis
        if macd > 0:
            reasons.append("MACD shows bullish momentum")
        else:
            reasons.append("MACD shows bearish momentum")
        
        # Sentiment
        if sentiment > 0.6:
            reasons.append("positive market sentiment")
        elif sentiment < 0.4:
            reasons.append("negative market sentiment")
        else:
            reasons.append("neutral market sentiment")
        
        base = f"Based on {', '.join(reasons)}, "
        conclusion = f"the model predicts {trend.lower()} movement with a {signal} signal."
        
        return base + conclusion


# ===== Example Usage =====
if __name__ == "__main__":
    # Initialize model
    tft = TemporalFusionTransformer()
    
    # Create mock OHLCV data
    np.random.seed(42)
    n_samples = 200
    
    mock_data = pd.DataFrame({
        'open': np.random.uniform(40000, 45000, n_samples),
        'high': np.random.uniform(42000, 47000, n_samples),
        'low': np.random.uniform(38000, 43000, n_samples),
        'close': np.random.uniform(40000, 45000, n_samples),
        'volume': np.random.uniform(1e9, 5e9, n_samples)
    })
    
    # Prepare features
    features = tft.prepare_features(mock_data)
    
    # Make prediction
    prediction = tft.predict(features, sentiment_score=0.72)
    
    print("=" * 60)
    print("TFT Price Prediction Demo")
    print("=" * 60)
    print(f"\nTrend: {prediction['trend']}")
    print(f"Signal: {prediction['signal']}")
    print(f"Confidence: {prediction['confidence']}%")
    print(f"Predicted Price: ${prediction['predicted_price']:,.2f}")
    print(f"Price Range: ${prediction['predicted_range']['low']:,.2f} - ${prediction['predicted_range']['high']:,.2f}")
    print(f"Risk Level: {prediction['risk_level']}")
    print(f"\nReasoning: {prediction['reasoning']}")
    print("\nFeature Importance:")
    for feat in prediction['feature_importance']:
        print(f"  - {feat['name']}: {feat['value']:.0%}")
