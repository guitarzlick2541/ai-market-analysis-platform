import pytest
import numpy as np
from src.api.ai import calculate_rsi, calculate_macd, _calculate_risk

class TestAILogic:
    
    def test_calculate_rsi(self):
        """Test RSI calculation with known valid data"""
        # Scenario: Increasing prices -> High RSI
        prices = np.array([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24])
        rsi = calculate_rsi(prices, period=14)
        
        # With clear uptrend, RSI should be 100 or close to it depending on implementation details
        # Our implementation: avg_loss is 0 -> RSI 100
        assert rsi == 100.0, f"Expected RSI 100 for pure uptrend, got {rsi}"

    def test_calculate_rsi_fluctuating(self):
        """Test RSI with fluctuating prices"""
        prices = np.array([10, 12, 11, 13, 12, 14, 13, 15, 14, 16, 15, 17, 16, 18, 17])
        rsi = calculate_rsi(prices, period=14)
        
        # Should be between 0 and 100
        assert 0 <= rsi <= 100
        
    def test_calculate_macd(self):
        """Test MACD structure and return values"""
        prices = np.linspace(10, 20, 50) # 50 data points
        result = calculate_macd(prices)
        
        assert "macd" in result
        assert "signal" in result
        assert "histogram" in result
        assert isinstance(result["macd"], float)

    def test_calculate_risk_high(self):
        """Test Risk Calculation: High Volatility + High RSI"""
        # RSI > 75 -> +2 risk
        # Volatility > 5 -> +2 risk
        # Total 4 -> HIGH
        risk = _calculate_risk(rsi=80, volatility=6.0)
        assert risk == "HIGH"

    def test_calculate_risk_low(self):
        """Test Risk Calculation: Low Volatility + Neutral RSI"""
        # RSI 50 -> +0 risk
        # Volatility 1.0 -> +0 risk
        # Total 0 -> LOW
        risk = _calculate_risk(rsi=50, volatility=1.0)
        assert risk == "LOW"
