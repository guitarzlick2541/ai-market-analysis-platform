import logging
import asyncio
import json
import time
import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
from datetime import datetime

router = APIRouter()

# Global config
AI_SERVICE_URL = "http://localhost:8001"

# ===== WebSocket Manager =====
class MonitorConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        try:
            self.active_connections.remove(websocket)
        except ValueError:
            pass  # Already removed or never added

    async def broadcast_log(self, log_entry: dict):
        # Broadcast to all connected clients
        for connection in self.active_connections:
            try:
                await connection.send_json(log_entry)
            except Exception:
                # If sending fails, we might clean up, but generally disconnect handles removal
                pass

monitor_manager = MonitorConnectionManager()

# ===== Custom Logging Handler =====
class WebSocketLogHandler(logging.Handler):
    """
    Custom logging handler that pushes logs to WebSocket manager
    """
    def emit(self, record):
        try:
            msg = self.format(record)
            log_entry = {
                "id": int(time.time() * 1000),
                "time": datetime.utcnow().strftime("%H:%M:%S"),
                "type": record.levelname,
                "msg": msg
            }
            # We need to run this async method from a sync context
            # Using asyncio.create_task only works if there is a running loop
            try:
                loop = asyncio.get_running_loop()
                if loop.is_running():
                    loop.create_task(monitor_manager.broadcast_log(log_entry))
            except RuntimeError:
                pass 
        except Exception:
            self.handleError(record)

# ===== Helper Functions =====
async def check_service_health(name: str, url: str) -> Dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            start = time.time()
            resp = await client.get(url)
            latency = int((time.time() - start) * 1000)
            
            return {
                "status": "UP" if resp.status_code == 200 else "DEGRADED",
                "latency_ms": latency,
                "detail": f"Status {resp.status_code}"
            }
    except Exception as e:
        return {
            "status": "DOWN",
            "latency_ms": 0,
            "detail": str(e)
        }

# ===== Routes =====

@router.get("/health")
async def get_system_health():
    """
    Comprehensive System Health Check
    """
    # 1. Check AI Service
    ai_health = await check_service_health("AI Service", f"{AI_SERVICE_URL}/health")
    
    # 2. Check Yahoo Finance (Connectivity Check)
    yahoo_health = await check_service_health("Yahoo Finance", "https://query1.finance.yahoo.com/v1/test/getcrumb")
    
    # 3. Check Database (Mock for now)
    db_health = {"status": "UP", "latency_ms": 12, "detail": "Connection Pool Active"}

    # Overall Status Calculation
    overall_status = "HEALTHY"
    if ai_health["status"] == "DOWN" or yahoo_health["status"] == "DOWN":
        overall_status = "DEGRADED"
    if ai_health["status"] == "DOWN" and yahoo_health["status"] == "DOWN": # Critical failure
        overall_status = "DOWN"

    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "ai_engine": ai_health,
            "market_data": yahoo_health,
            "database": db_health
        },
        "system": {
            "version": "1.0.0",
            "environment": "production"
        }
    }

@router.get("/endpoints")
async def check_endpoints():
    """
    Simulated Endpoint Latency Check
    """
    # In a real app, we might use middleware metrics
    # Here simulating latency checks
    return [
         { "path": "/api/market/quotes", "method": "GET", "status": "UP", "latency": 45 },
         { "path": "/api/ai/signals", "method": "GET", "status": "UP", "latency": 320 },
         { "path": "/api/auth/login", "method": "POST", "status": "UP", "latency": 28 },
    ]

@router.websocket("/ws")
async def websocket_monitor(websocket: WebSocket):
    await monitor_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive an listen for client commands
            data = await websocket.receive_text()
            # We could handle subscription logic here if needed
            # For now, just echo or ignore
    except WebSocketDisconnect:
        monitor_manager.disconnect(websocket)
