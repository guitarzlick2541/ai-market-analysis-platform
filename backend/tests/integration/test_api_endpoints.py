import pytest
from httpx import AsyncClient

class TestIntegrationAPI:
    
    @pytest.mark.asyncio
    async def test_health_check(self, async_client: AsyncClient):
        """Test Health Check Endpoint"""
        response = await async_client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "services" in data

    @pytest.mark.asyncio
    async def test_get_market_assets(self, async_client: AsyncClient):
        """Test fetching real market assets (Network Bound)"""
        # This calls real Yahoo API, might be slow
        response = await async_client.get("/api/market/assets")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        if len(data) > 0:
            asset = data[0]
            assert "symbol" in asset
            assert "price" in asset
            assert asset["price"] >= 0  # Price should be positive or zero

    @pytest.mark.asyncio
    async def test_get_ai_signal_fallback(self, async_client: AsyncClient):
        """Test AI Signal endpoint (checking structure and fallback)"""
        # BTC-USD usually available
        response = await async_client.get("/api/ai/signals/BTC-USD")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["asset"] == "BTC-USD"
        assert data["signal"] in ["BUY", "SELL", "HOLD"]
        assert "confidence" in data
        assert "reasoning" in data
        
        # Verify Fallback or Real logic logic
        # If AI service is down (likely in test env), it should use fallback
        # "Fallback: Rule-based" in reasoning is expected if AI service is not mocked/up
        # But we create test to accept VALID response regardless of source
        assert isinstance(data["predicted_price"], (int, float))

    @pytest.mark.asyncio
    async def test_news_endpoint(self, async_client: AsyncClient):
        """Test News Endpoint with Fallback"""
        response = await async_client.get("/api/market/news")
        
        assert response.status_code == 200
        news_list = response.json()
        
        assert isinstance(news_list, list)
        assert len(news_list) > 0 # Should return data (real or fallback)
        
        item = news_list[0]
        assert "title" in item
        assert "publisher" in item
        assert "link" in item
