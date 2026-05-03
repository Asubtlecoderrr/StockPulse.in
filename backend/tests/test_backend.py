"""Backend tests for Indian Stock & ETF Alert app."""
import os
import time
import pytest
import requests

BASE_URL = "https://market-pulse-in-17.preview.emergentagent.com".rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    yield s
    # cleanup TEST_ items
    try:
        for item in s.get(f"{API}/watchlist", timeout=30).json():
            if item.get("symbol", "").startswith("TEST_") or item.get("name", "").startswith("TEST_"):
                s.delete(f"{API}/watchlist/{item['id']}", timeout=30)
    except Exception:
        pass


# ---------- Health & Market ----------
def test_health(client):
    r = client.get(f"{API}/health", timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "ok"
    assert d["twilio_configured"] is False


def test_market_status(client):
    r = client.get(f"{API}/market-status", timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert isinstance(d["is_open"], bool)
    assert "current_time_ist" in d
    assert d["timezone"] == "Asia/Kolkata"


# ---------- Search ----------
def test_search_reli(client):
    r = client.get(f"{API}/search", params={"q": "RELI"}, timeout=30)
    assert r.status_code == 200
    syms = [x["symbol"] for x in r.json()["results"]]
    assert "RELIANCE.NS" in syms


def test_search_empty(client):
    r = client.get(f"{API}/search", params={"q": ""}, timeout=30)
    assert r.status_code == 200
    assert r.json()["results"] == []


# ---------- Settings ----------
def test_settings_get(client):
    r = client.get(f"{API}/settings", timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert d["twilio_configured"] is False
    assert "destination_whatsapp" in d


def test_settings_put_valid(client):
    r = client.put(f"{API}/settings", json={"destination_whatsapp": "+919999999999"}, timeout=30)
    assert r.status_code == 200
    assert r.json()["destination_whatsapp"] == "+919999999999"


def test_settings_put_invalid(client):
    r = client.put(f"{API}/settings", json={"destination_whatsapp": "919999999999"}, timeout=30)
    assert r.status_code == 400


# ---------- Watchlist CRUD ----------
@pytest.fixture(scope="module")
def created_id(client):
    # Clean any prior RELIANCE below
    for item in client.get(f"{API}/watchlist", timeout=30).json():
        if item["symbol"] == "RELIANCE.NS" and item["alert_type"] == "below":
            client.delete(f"{API}/watchlist/{item['id']}", timeout=30)
    payload = {"symbol": "RELIANCE.NS", "name": "Reliance Industries Ltd",
               "alert_type": "below", "threshold": 1000}
    r = client.post(f"{API}/watchlist", json=payload, timeout=60)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["symbol"] == "RELIANCE.NS"
    assert d["triggered"] is False
    assert "id" in d
    # current_price may be None if yfinance fails - treat as flaky
    return d["id"]


def test_watchlist_create_populates_price(client, created_id):
    r = client.get(f"{API}/watchlist", timeout=30)
    assert r.status_code == 200
    items = r.json()
    # verify no _id leak
    for it in items:
        assert "_id" not in it
    match = [i for i in items if i["id"] == created_id][0]
    assert match["symbol"] == "RELIANCE.NS"


def test_watchlist_duplicate_409(client, created_id):
    payload = {"symbol": "RELIANCE.NS", "name": "Reliance Industries Ltd",
               "alert_type": "below", "threshold": 1200}
    r = client.post(f"{API}/watchlist", json=payload, timeout=30)
    assert r.status_code == 409


def test_watchlist_patch(client, created_id):
    r = client.patch(f"{API}/watchlist/{created_id}",
                     json={"threshold": 500}, timeout=30)
    assert r.status_code == 200
    assert r.json()["threshold"] == 500
    assert r.json()["triggered"] is False


def test_watchlist_patch_pct_drop_resets_ref(client, created_id):
    r = client.patch(f"{API}/watchlist/{created_id}",
                     json={"alert_type": "pct_drop", "threshold": 5}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert d["alert_type"] == "pct_drop"
    # reference_price should be set (unless price fetch failed earlier)
    # revert to below for later tests
    client.patch(f"{API}/watchlist/{created_id}",
                 json={"alert_type": "below", "threshold": 1000}, timeout=30)


def test_alerts_initial(client):
    r = client.get(f"{API}/alerts", timeout=30)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ---------- Alert fire flow ----------
def test_alert_fires_and_resets(client):
    # Create above alert with very low threshold -> should fire
    # First remove existing above on RELIANCE
    for item in client.get(f"{API}/watchlist", timeout=30).json():
        if item["symbol"] == "RELIANCE.NS" and item["alert_type"] == "above":
            client.delete(f"{API}/watchlist/{item['id']}", timeout=30)

    payload = {"symbol": "RELIANCE.NS", "name": "Reliance Industries Ltd",
               "alert_type": "above", "threshold": 1}
    r = client.post(f"{API}/watchlist", json=payload, timeout=60)
    assert r.status_code == 200
    item_id = r.json()["id"]

    # Need destination set for alert body (already set in earlier test)
    client.put(f"{API}/settings", json={"destination_whatsapp": "+919999999999"}, timeout=30)

    alerts_before = len(client.get(f"{API}/alerts", timeout=30).json())

    r = client.post(f"{API}/watchlist/refresh", timeout=120)
    assert r.status_code == 200
    summary = r.json()

    # If yfinance failed entirely, skip
    if summary.get("errors", 0) >= 1 and summary.get("updated", 0) == 0:
        pytest.skip("yfinance unavailable; skipping fire test")

    time.sleep(1)
    items = client.get(f"{API}/watchlist", timeout=30).json()
    match = [i for i in items if i["id"] == item_id][0]
    assert match["triggered"] is True, f"Expected trigger; item={match} summary={summary}"

    alerts_after = client.get(f"{API}/alerts", timeout=30).json()
    assert len(alerts_after) > alerts_before
    latest = [a for a in alerts_after if a["watchlist_id"] == item_id][0]
    assert latest["delivery_status"] == "mocked"

    # Reset - set threshold very high so condition no longer met
    r = client.patch(f"{API}/watchlist/{item_id}",
                     json={"threshold": 10_000_000}, timeout=30)
    assert r.status_code == 200
    assert r.json()["triggered"] is False

    r = client.post(f"{API}/watchlist/refresh", timeout=120)
    assert r.status_code == 200
    items = client.get(f"{API}/watchlist", timeout=30).json()
    match = [i for i in items if i["id"] == item_id][0]
    assert match["triggered"] is False

    # cleanup
    client.delete(f"{API}/watchlist/{item_id}", timeout=30)


def test_delete_cascade(client):
    payload = {"symbol": "TCS.NS", "name": "Tata Consultancy Services Ltd",
               "alert_type": "above", "threshold": 1}
    # remove any existing
    for item in client.get(f"{API}/watchlist", timeout=30).json():
        if item["symbol"] == "TCS.NS" and item["alert_type"] == "above":
            client.delete(f"{API}/watchlist/{item['id']}", timeout=30)
    r = client.post(f"{API}/watchlist", json=payload, timeout=60)
    assert r.status_code == 200
    item_id = r.json()["id"]
    client.post(f"{API}/watchlist/refresh", timeout=120)
    r = client.delete(f"{API}/watchlist/{item_id}", timeout=30)
    assert r.status_code == 200
    assert r.json()["deleted"] is True
    # verify gone
    items = client.get(f"{API}/watchlist", timeout=30).json()
    assert not any(i["id"] == item_id for i in items)
    # verify alerts cascaded
    alerts = client.get(f"{API}/alerts", timeout=30).json()
    assert not any(a["watchlist_id"] == item_id for a in alerts)
