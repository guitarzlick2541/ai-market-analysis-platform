"""
Watchlist API Routes
Manages user watchlists for tracking assets
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter()


# ===== Pydantic Models =====

class WatchlistItem(BaseModel):
    id: str
    user_id: str
    asset_symbol: str
    added_at: str
    alert_enabled: bool = False
    notes: Optional[str] = None

class AddToWatchlist(BaseModel):
    asset_symbol: str
    alert_enabled: bool = False
    notes: Optional[str] = None

class UpdateWatchlistItem(BaseModel):
    alert_enabled: Optional[bool] = None
    notes: Optional[str] = None


# ===== Mock Database =====

mock_watchlist = [
    WatchlistItem(id="1", user_id="demo", asset_symbol="BTC-USD", added_at=datetime.utcnow().isoformat(), alert_enabled=True),
    WatchlistItem(id="2", user_id="demo", asset_symbol="ETH-USD", added_at=datetime.utcnow().isoformat(), alert_enabled=True),
    WatchlistItem(id="3", user_id="demo", asset_symbol="AAPL", added_at=datetime.utcnow().isoformat(), alert_enabled=False),
    WatchlistItem(id="4", user_id="demo", asset_symbol="NVDA", added_at=datetime.utcnow().isoformat(), alert_enabled=True),
    WatchlistItem(id="5", user_id="demo", asset_symbol="XAU-USD", added_at=datetime.utcnow().isoformat(), alert_enabled=False),
]


# ===== Routes =====

@router.get("/", response_model=List[WatchlistItem])
async def get_watchlist():
    """
    Get user's watchlist
    """
    return mock_watchlist


@router.post("/", response_model=WatchlistItem)
async def add_to_watchlist(item: AddToWatchlist):
    """
    Add asset to watchlist
    """
    # Check if already in watchlist
    for existing in mock_watchlist:
        if existing.asset_symbol == item.asset_symbol.upper():
            raise HTTPException(status_code=400, detail="Asset already in watchlist")
    
    new_item = WatchlistItem(
        id=str(uuid.uuid4()),
        user_id="demo",
        asset_symbol=item.asset_symbol.upper(),
        added_at=datetime.utcnow().isoformat(),
        alert_enabled=item.alert_enabled,
        notes=item.notes
    )
    mock_watchlist.append(new_item)
    
    return new_item


@router.put("/{asset_symbol}", response_model=WatchlistItem)
async def update_watchlist_item(asset_symbol: str, update: UpdateWatchlistItem):
    """
    Update watchlist item settings
    """
    asset_symbol = asset_symbol.upper()
    
    for item in mock_watchlist:
        if item.asset_symbol == asset_symbol:
            if update.alert_enabled is not None:
                item.alert_enabled = update.alert_enabled
            if update.notes is not None:
                item.notes = update.notes
            return item
    
    raise HTTPException(status_code=404, detail="Asset not in watchlist")


@router.delete("/{asset_symbol}")
async def remove_from_watchlist(asset_symbol: str):
    """
    Remove asset from watchlist
    """
    asset_symbol = asset_symbol.upper()
    
    for i, item in enumerate(mock_watchlist):
        if item.asset_symbol == asset_symbol:
            mock_watchlist.pop(i)
            return {"success": True, "message": f"{asset_symbol} removed from watchlist"}
    
    raise HTTPException(status_code=404, detail="Asset not in watchlist")


@router.get("/check/{asset_symbol}")
async def check_in_watchlist(asset_symbol: str):
    """
    Check if asset is in watchlist
    """
    asset_symbol = asset_symbol.upper()
    
    for item in mock_watchlist:
        if item.asset_symbol == asset_symbol:
            return {"in_watchlist": True, "item": item}
    
    return {"in_watchlist": False}
