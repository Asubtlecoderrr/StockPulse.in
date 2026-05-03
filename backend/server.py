"""Indian Stock & ETF Alert Application backend.

- FastAPI + Motor (MongoDB) + APScheduler + yfinance + Twilio.
- Runs a 5-minute price-check job during NSE market hours (Mon-Fri 09:15-15:30 IST).
- Sends WhatsApp alerts via Twilio when thresholds are crossed (mocked if
  Twilio credentials are missing/placeholder).
"""

from __future__ import annotations

import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, time, timezone
from pathlib import Path
from typing import List, Literal, Optional

import pytz
import yfinance as yf
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, Field
from starlette.middleware.cors import CORSMiddleware
from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client as TwilioClient

from nse_symbols import search_symbols

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("alert-backend")

IST = pytz.timezone("Asia/Kolkata")
MARKET_OPEN = time(9, 15)
MARKET_CLOSE = time(15, 30)

mongo_url = os.environ["MONGO_URL"]
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ["DB_NAME"]]

TWILIO_SID = os.environ.get("TWILIO_ACCOUNT_SID", "").strip()
TWILIO_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "").strip()
TWILIO_FROM = os.environ.get("TWILIO_WHATSAPP_FROM", "").strip()


def twilio_is_configured() -> bool:
    return (
        bool(TWILIO_SID)
        and TWILIO_SID.startswith("AC")
        and bool(TWILIO_TOKEN)
        and bool(TWILIO_FROM)
    )


def get_twilio_client() -> Optional[TwilioClient]:
    if not twilio_is_configured():
        return None
    try:
        return TwilioClient(TWILIO_SID, TWILIO_TOKEN)
    except Exception as exc:  # pragma: no cover - defensive
        logger.error("Twilio client init failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Market hours helpers
# ---------------------------------------------------------------------------
def now_ist() -> datetime:
    return datetime.now(IST)


def is_market_open(ref: Optional[datetime] = None) -> bool:
    ref = ref or now_ist()
    if ref.weekday() >= 5:  # Sat/Sun
        return False
    return MARKET_OPEN <= ref.time() <= MARKET_CLOSE


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
AlertType = Literal["below", "above", "pct_drop"]


class WatchlistCreate(BaseModel):
    symbol: str
    name: str
    exchange: str = "NSE"
    alert_type: AlertType = "below"
    threshold: float = Field(..., description="For pct_drop this is a percentage (e.g. 5)")


class WatchlistUpdate(BaseModel):
    alert_type: Optional[AlertType] = None
    threshold: Optional[float] = None


class WatchlistItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    symbol: str
    name: str
    exchange: str
    alert_type: AlertType
    threshold: float
    reference_price: Optional[float] = None
    current_price: Optional[float] = None
    previous_close: Optional[float] = None
    day_change_pct: Optional[float] = None
    last_updated: Optional[str] = None
    triggered: bool = False
    created_at: str


class AlertRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    watchlist_id: str
    symbol: str
    name: str
    alert_type: AlertType
    threshold: float
    price: float
    message: str
    delivery_status: str  # "sent" | "mocked" | "failed"
    sent_at: str


class Settings(BaseModel):
    destination_whatsapp: Optional[str] = None
    twilio_configured: bool = False
    updated_at: Optional[str] = None


class SettingsUpdate(BaseModel):
    destination_whatsapp: str


# ---------------------------------------------------------------------------
# Price fetching
# ---------------------------------------------------------------------------
async def fetch_price(symbol: str) -> Optional[dict]:
    """Fetch latest price for a yfinance symbol. Returns dict or None on failure."""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="2d", interval="1d")
        if hist is None or hist.empty:
            return None
        last_close = float(hist["Close"].iloc[-1])
        prev_close = float(hist["Close"].iloc[-2]) if len(hist) > 1 else last_close
        # Try intraday for more recent price if available
        try:
            intraday = ticker.history(period="1d", interval="5m")
            if intraday is not None and not intraday.empty:
                last_close = float(intraday["Close"].iloc[-1])
        except Exception:
            pass
        change_pct = ((last_close - prev_close) / prev_close * 100) if prev_close else 0.0
        return {
            "price": round(last_close, 2),
            "previous_close": round(prev_close, 2),
            "day_change_pct": round(change_pct, 2),
        }
    except Exception as exc:
        logger.warning("fetch_price failed for %s: %s", symbol, exc)
        return None


# ---------------------------------------------------------------------------
# Alert evaluation
# ---------------------------------------------------------------------------
def _evaluate(item: dict, current_price: float) -> bool:
    """Return True if alert condition is met for current_price."""
    atype = item.get("alert_type")
    threshold = float(item.get("threshold") or 0)
    if atype == "below":
        return current_price <= threshold
    if atype == "above":
        return current_price >= threshold
    if atype == "pct_drop":
        ref = item.get("reference_price")
        if not ref:
            return False
        drop_pct = (ref - current_price) / ref * 100
        return drop_pct >= threshold
    return False


def _format_message(item: dict, current_price: float) -> str:
    symbol = item["symbol"].replace(".NS", "").replace(".BO", "")
    atype = item["alert_type"]
    threshold = item["threshold"]
    if atype == "below":
        return (
            f"Alert: {symbol} has dropped below Rs.{threshold}. "
            f"Current price: Rs.{current_price}"
        )
    if atype == "above":
        return (
            f"Alert: {symbol} has risen above Rs.{threshold}. "
            f"Current price: Rs.{current_price}"
        )
    if atype == "pct_drop":
        ref = item.get("reference_price") or current_price
        drop_pct = (ref - current_price) / ref * 100
        return (
            f"Alert: {symbol} dropped {drop_pct:.2f}% from Rs.{ref} "
            f"(threshold {threshold}%). Current price: Rs.{current_price}"
        )
    return f"Alert: {symbol} at Rs.{current_price}"


async def _send_whatsapp(to_number: str, body: str) -> str:
    """Send a WhatsApp message. Returns delivery status string."""
    client = get_twilio_client()
    if client is None:
        logger.info("[MOCK WHATSAPP] to=%s body=%s", to_number, body)
        return "mocked"
    try:
        to = to_number if to_number.startswith("whatsapp:") else f"whatsapp:{to_number}"
        fr = TWILIO_FROM if TWILIO_FROM.startswith("whatsapp:") else f"whatsapp:{TWILIO_FROM}"
        client.messages.create(from_=fr, to=to, body=body)
        return "sent"
    except TwilioRestException as exc:
        logger.error("Twilio send failed: %s", exc)
        return "failed"
    except Exception as exc:  # pragma: no cover
        logger.error("Unexpected Twilio error: %s", exc)
        return "failed"


async def _update_watchlist_prices_and_fire_alerts(respect_market_hours: bool = True) -> dict:
    """Refresh prices for all watchlist items and dispatch alerts as needed."""
    summary = {"updated": 0, "alerts_sent": 0, "alerts_reset": 0, "errors": 0}
    items = await db.watchlist.find({}, {"_id": 0}).to_list(500)
    if not items:
        return summary

    settings_doc = await db.settings.find_one({"_id": "singleton"}) or {}
    destination = settings_doc.get("destination_whatsapp")

    now_iso = now_ist().isoformat()
    market_open = is_market_open()

    for item in items:
        price_info = await fetch_price(item["symbol"])
        if price_info is None:
            summary["errors"] += 1
            continue
        current_price = price_info["price"]
        updates = {
            "current_price": current_price,
            "previous_close": price_info["previous_close"],
            "day_change_pct": price_info["day_change_pct"],
            "last_updated": now_iso,
        }
        # Initialize reference_price for pct_drop if missing
        if item.get("alert_type") == "pct_drop" and not item.get("reference_price"):
            updates["reference_price"] = current_price
            item["reference_price"] = current_price

        condition_met = _evaluate(item, current_price)
        was_triggered = bool(item.get("triggered"))

        if condition_met and not was_triggered:
            # Only fire alerts during market hours (if respected)
            if respect_market_hours and not market_open:
                pass
            else:
                body = _format_message(item, current_price)
                status = await _send_whatsapp(destination or "", body) if destination else "mocked"
                alert_doc = {
                    "id": str(uuid.uuid4()),
                    "watchlist_id": item["id"],
                    "symbol": item["symbol"],
                    "name": item["name"],
                    "alert_type": item["alert_type"],
                    "threshold": item["threshold"],
                    "price": current_price,
                    "message": body,
                    "delivery_status": status,
                    "sent_at": now_iso,
                }
                await db.alerts.insert_one(alert_doc)
                updates["triggered"] = True
                summary["alerts_sent"] += 1
        elif (not condition_met) and was_triggered:
            updates["triggered"] = False
            summary["alerts_reset"] += 1

        await db.watchlist.update_one({"id": item["id"]}, {"$set": updates})
        summary["updated"] += 1
    return summary


# ---------------------------------------------------------------------------
# Scheduler
# ---------------------------------------------------------------------------
scheduler = AsyncIOScheduler(timezone=IST)


async def scheduled_job():
    if not is_market_open():
        logger.info("Market closed; skipping scheduled run.")
        return
    logger.info("Running scheduled price check...")
    summary = await _update_watchlist_prices_and_fire_alerts(respect_market_hours=True)
    logger.info("Scheduled run complete: %s", summary)


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Cron: every 5 minutes, Mon-Fri, 9:15 to 15:30 IST.
    scheduler.add_job(
        scheduled_job,
        CronTrigger(day_of_week="mon-fri", hour="9-15", minute="*/5", timezone=IST),
        id="price_check",
        replace_existing=True,
        max_instances=1,
    )
    scheduler.start()
    logger.info("Scheduler started. Twilio configured: %s", twilio_is_configured())
    yield
    scheduler.shutdown(wait=False)
    mongo_client.close()


app = FastAPI(lifespan=lifespan, title="StockPulse India")
api = APIRouter(prefix="/api")


# -------------------- Health & Market -------------------------------------
@api.get("/health")
async def health():
    return {"status": "ok", "twilio_configured": twilio_is_configured()}


@api.get("/market-status")
async def market_status():
    now = now_ist()
    return {
        "is_open": is_market_open(now),
        "current_time_ist": now.isoformat(),
        "market_open": MARKET_OPEN.strftime("%H:%M"),
        "market_close": MARKET_CLOSE.strftime("%H:%M"),
        "timezone": "Asia/Kolkata",
        "weekday": now.strftime("%A"),
    }


# -------------------- Search ----------------------------------------------
@api.get("/search")
async def search(q: str = ""):
    results = search_symbols(q, limit=15)
    return {"query": q, "results": results}


# -------------------- Watchlist CRUD --------------------------------------
@api.get("/watchlist", response_model=List[WatchlistItem])
async def list_watchlist():
    items = await db.watchlist.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


@api.post("/watchlist", response_model=WatchlistItem)
async def add_watchlist(payload: WatchlistCreate):
    # Prevent duplicates of same symbol + alert_type
    existing = await db.watchlist.find_one(
        {"symbol": payload.symbol, "alert_type": payload.alert_type}, {"_id": 0}
    )
    if existing:
        raise HTTPException(status_code=409, detail="Same symbol + alert type already exists")

    price_info = await fetch_price(payload.symbol)
    now_iso = now_ist().isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "symbol": payload.symbol,
        "name": payload.name,
        "exchange": payload.exchange,
        "alert_type": payload.alert_type,
        "threshold": float(payload.threshold),
        "reference_price": price_info["price"] if price_info else None,
        "current_price": price_info["price"] if price_info else None,
        "previous_close": price_info["previous_close"] if price_info else None,
        "day_change_pct": price_info["day_change_pct"] if price_info else None,
        "last_updated": now_iso if price_info else None,
        "triggered": False,
        "created_at": now_iso,
    }
    await db.watchlist.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


@api.patch("/watchlist/{item_id}", response_model=WatchlistItem)
async def update_watchlist(item_id: str, payload: WatchlistUpdate):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    # If alert_type changed to pct_drop, refresh reference_price
    existing = await db.watchlist.find_one({"id": item_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    new_type = updates.get("alert_type", existing["alert_type"])
    if new_type == "pct_drop":
        # Reset reference price to current price at time of update
        updates["reference_price"] = existing.get("current_price") or existing.get("reference_price")
    updates["triggered"] = False  # Reset trigger on any modification
    await db.watchlist.update_one({"id": item_id}, {"$set": updates})
    doc = await db.watchlist.find_one({"id": item_id}, {"_id": 0})
    return doc


@api.delete("/watchlist/{item_id}")
async def delete_watchlist(item_id: str):
    res = await db.watchlist.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    # Cascade delete alerts
    await db.alerts.delete_many({"watchlist_id": item_id})
    return {"deleted": True, "id": item_id}


@api.post("/watchlist/refresh")
async def refresh_watchlist():
    """Manual refresh. Ignores market hours for price updates, still sends alerts."""
    summary = await _update_watchlist_prices_and_fire_alerts(respect_market_hours=False)
    return summary


# -------------------- Alerts history --------------------------------------
@api.get("/alerts", response_model=List[AlertRecord])
async def list_alerts(limit: int = 50):
    docs = await db.alerts.find({}, {"_id": 0}).sort("sent_at", -1).to_list(limit)
    return docs


# -------------------- Settings --------------------------------------------
@api.get("/settings", response_model=Settings)
async def get_settings():
    doc = await db.settings.find_one({"_id": "singleton"}) or {}
    return {
        "destination_whatsapp": doc.get("destination_whatsapp"),
        "twilio_configured": twilio_is_configured(),
        "updated_at": doc.get("updated_at"),
    }


@api.put("/settings", response_model=Settings)
async def update_settings(payload: SettingsUpdate):
    number = payload.destination_whatsapp.strip()
    if number and not number.startswith("+"):
        raise HTTPException(status_code=400, detail="Use E.164 format, e.g. +919999999999")
    now_iso = now_ist().isoformat()
    await db.settings.update_one(
        {"_id": "singleton"},
        {"$set": {"destination_whatsapp": number, "updated_at": now_iso}},
        upsert=True,
    )
    return {
        "destination_whatsapp": number,
        "twilio_configured": twilio_is_configured(),
        "updated_at": now_iso,
    }


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
