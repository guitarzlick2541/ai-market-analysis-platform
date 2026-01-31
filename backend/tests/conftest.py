import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from main import app
import os
import sys

# Add src to python path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Note: pytest-asyncio handles event_loop automatically with asyncio_mode=auto

@pytest.fixture(scope="function")
async def async_client():
    """Async client for integration tests"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
