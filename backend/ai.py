"""Lightweight Ollama client for AI helpers.

Graceful fallback: if Ollama isn't reachable / model missing, all helpers
return None and the caller skips the AI feature. The rest of the app keeps
working.
"""

from __future__ import annotations

import json
import logging
import os
from typing import List, Optional

import httpx

logger = logging.getLogger("alert-backend.ai")

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.1:8b")
AI_ENABLED = os.environ.get("AI_ENABLED", "true").lower() in ("1", "true", "yes")


async def ai_health() -> dict:
    """Probe Ollama and check if the configured model is available."""
    if not AI_ENABLED:
        return {"reachable": False, "model_ready": False, "host": OLLAMA_HOST, "model": OLLAMA_MODEL, "reason": "disabled"}
    try:
        async with httpx.AsyncClient(timeout=4) as client:
            r = await client.get(f"{OLLAMA_HOST}/api/tags")
        if r.status_code != 200:
            return {"reachable": False, "model_ready": False, "host": OLLAMA_HOST, "model": OLLAMA_MODEL, "reason": f"http {r.status_code}"}
        models = [m.get("name") for m in r.json().get("models", [])]
        ready = any(m == OLLAMA_MODEL or m.startswith(OLLAMA_MODEL.split(":")[0]) for m in models)
        return {
            "reachable": True,
            "model_ready": ready,
            "host": OLLAMA_HOST,
            "model": OLLAMA_MODEL,
            "available_models": models,
        }
    except Exception as exc:
        return {"reachable": False, "model_ready": False, "host": OLLAMA_HOST, "model": OLLAMA_MODEL, "reason": str(exc)}


async def _generate(prompt: str, system: Optional[str] = None, temperature: float = 0.3, max_tokens: int = 240) -> Optional[str]:
    """Call Ollama /api/generate. Returns text or None on failure."""
    if not AI_ENABLED:
        return None
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": temperature, "num_predict": max_tokens},
    }
    if system:
        payload["system"] = system
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            r = await client.post(f"{OLLAMA_HOST}/api/generate", json=payload)
        if r.status_code != 200:
            logger.warning("Ollama %s: %s", r.status_code, r.text[:200])
            return None
        text = (r.json().get("response") or "").strip()
        return text or None
    except Exception as exc:
        logger.warning("Ollama call failed: %s", exc)
        return None


def _parse_json_block(text: str) -> Optional[dict]:
    """Robustly extract a JSON object from an LLM response (handles ```json fences)."""
    if not text:
        return None
    # Strip code fences
    t = text.strip()
    if t.startswith("```"):
        t = t.strip("`")
        if t.lower().startswith("json"):
            t = t[4:]
    # Find first { ... last }
    i = t.find("{")
    j = t.rfind("}")
    if i == -1 or j == -1 or j <= i:
        return None
    blob = t[i:j + 1]
    try:
        return json.loads(blob)
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Feature 1: "Why now" explainer for fired alerts
# ---------------------------------------------------------------------------
async def generate_why_now(
    *,
    symbol: str,
    name: str,
    alert_type: str,
    threshold: float,
    price: float,
    day_change_pct: Optional[float],
    sparkline: Optional[List[float]] = None,
    headlines: Optional[List[str]] = None,
) -> Optional[str]:
    """Return a 1-2 sentence explanation of why the alert likely fired."""
    bare = symbol.replace(".NS", "").replace(".BO", "")
    spark = ", ".join(f"{v}" for v in (sparkline or [])[-7:]) or "n/a"
    news = "\n".join(f"- {h}" for h in (headlines or [])[:5]) or "- (no recent news)"
    prompt = f"""A price alert just fired for an Indian stock.

Stock: {bare} ({name})
Alert: {alert_type} threshold {threshold}
Current price: Rs.{price}
Day change: {day_change_pct if day_change_pct is not None else 'n/a'}%
Last 7 daily closes: {spark}
Recent news headlines:
{news}

In ONE OR TWO short sentences (max 220 characters total), explain the most likely catalyst behind this move. Be specific and concrete. No disclaimers. No "as an AI" preamble. Plain text only."""
    out = await _generate(prompt, temperature=0.3, max_tokens=120)
    if not out:
        return None
    # Trim to 220 chars
    out = out.strip().strip('"').replace("\n\n", " ").replace("\n", " ")
    return out[:220]


# ---------------------------------------------------------------------------
# Feature 2: Daily market brief
# ---------------------------------------------------------------------------
async def generate_daily_brief(*, items: List[dict], alerts_today: int) -> Optional[str]:
    """Return a ~3-line WhatsApp-friendly summary of today's watchlist."""
    if not items:
        return None
    bullets = []
    for it in items[:15]:
        bare = it["symbol"].replace(".NS", "").replace(".BO", "")
        change = it.get("day_change_pct")
        bullets.append(f"- {bare}: Rs.{it.get('current_price','?')} ({change:+.2f}%)" if change is not None else f"- {bare}: Rs.{it.get('current_price','?')}")
    body = "\n".join(bullets)
    prompt = f"""You are an Indian-market briefing assistant. Today's NSE close, my watchlist:

{body}

Alerts that fired today: {alerts_today}

Write a 3-line summary for a WhatsApp message (TOTAL under 320 characters). Use this exact format:
Line 1: top mover and a brief why (you may infer plausible reason)
Line 2: notable underperformer OR fired alert context
Line 3: one short look-ahead for tomorrow

Plain text only. No emojis other than one optional at start of each line. No markdown."""
    out = await _generate(prompt, temperature=0.4, max_tokens=200)
    if not out:
        return None
    out = out.strip().strip('"')
    return out[:340]


# ---------------------------------------------------------------------------
# Feature 3: News sentiment classifier
# ---------------------------------------------------------------------------
async def score_sentiment(*, symbol: str, name: str, headlines: List[str]) -> Optional[dict]:
    """Return {sentiment: green|yellow|red, score: 0..1, summary: str} or None."""
    if not headlines:
        return {"sentiment": "yellow", "score": 0.5, "summary": "No recent news available."}
    bare = symbol.replace(".NS", "").replace(".BO", "")
    items = "\n".join(f"- {h}" for h in headlines[:6])
    prompt = f"""Classify the overall investor sentiment for {bare} ({name}) based on these recent news headlines:

{items}

Respond ONLY with a JSON object on a single line:
{{"sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE", "score": 0.0-1.0, "summary": "one short sentence under 120 chars"}}

No code fences. No commentary."""
    out = await _generate(prompt, temperature=0.2, max_tokens=140)
    if not out:
        return None
    parsed = _parse_json_block(out)
    if not parsed:
        return None
    raw = (parsed.get("sentiment") or "").upper()
    color = {"POSITIVE": "green", "NEGATIVE": "red", "NEUTRAL": "yellow"}.get(raw, "yellow")
    try:
        score = float(parsed.get("score") or 0.5)
    except Exception:
        score = 0.5
    summary = (parsed.get("summary") or "").strip()
    return {"sentiment": color, "score": max(0.0, min(1.0, score)), "summary": summary[:160]}
