# StockPulse.in — NSE / BSE Stock & ETF Alert App

A self-hosted, single-user web app that lets you watch Indian stocks/ETFs and get a **WhatsApp ping** the moment a price threshold is crossed. Powered by FastAPI + React + MongoDB, scheduled by APScheduler, fed by Yahoo Finance, delivered by Twilio.

![tech](https://img.shields.io/badge/backend-FastAPI-009688) ![tech](https://img.shields.io/badge/frontend-React%2019-61DAFB) ![tech](https://img.shields.io/badge/db-MongoDB-47A248) ![tech](https://img.shields.io/badge/data-yfinance-purple) ![tech](https://img.shields.io/badge/alerts-Twilio%20WhatsApp-25D366)

---

## Features

- 🔍 Autocomplete search across **170+ curated NSE stocks & ETFs**
- 🎯 Three alert types: **Price Below**, **Price Above**, **% Drop from add-time**
- 📈 Live quote on each Add-Alert dialog with **30-day sparkline** + **Day/30D/52W range bars**
- 💡 Quick-pick chips (`-3% / -5% / -10% / Day Low / 52W Low …`) so you never do mental math
- 🛡 **Smart Threshold Validator** warns when threshold is below 52W low / above 52W high / will fire immediately
- ⏱ Scheduler runs **every 5 minutes Mon–Fri 09:15–15:30 IST**, paused outside market hours
- 🔁 Manual **Refresh** button bypasses the time-gate for ad-hoc checks
- 📲 WhatsApp delivery via Twilio (with **MOCK mode** when keys are absent — alerts log to console)
- 📜 Alert history log, distance-to-trigger pills, price flash animations, IST clock
- 🧠 **AI features (local Llama via Ollama)** — see [section 7 below](#7-optional-ai-features-with-ollama):
  - **Why-now explainer** — every fired alert is enriched with a 1–2 sentence catalyst from recent news + price action
  - **Daily Market Brief** — AI-written 3-line summary at 15:35 IST sent to WhatsApp
  - **News sentiment chip** per watchlist row (🟢 POS / 🟡 NEU / 🔴 NEG) with tooltip + headlines

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI 0.110, Motor (async MongoDB), APScheduler 3.11 |
| Data | yfinance 1.3 (Yahoo Finance) — prices + news headlines |
| Alerts | Twilio Python SDK 9.x — WhatsApp Sandbox / Production |
| AI | Ollama (local Llama 3.1 8B) — runs on `localhost:11434`, optional |
| Frontend | React 19, Tailwind, shadcn/ui, lucide-react |
| Fonts | Bricolage Grotesque · Plus Jakarta Sans · JetBrains Mono |
| DB | MongoDB |

---

## Project Structure

```
.
├── backend/
│   ├── server.py            # FastAPI app, routes, scheduler, Twilio helpers
│   ├── nse_symbols.py       # Curated NSE/ETF symbol list + search()
│   ├── ai.py                # Ollama client + Why-now / Daily Brief / Sentiment helpers
│   ├── requirements.txt     # Python deps
│   ├── .env                 # Local environment (not committed)
│   └── .env.example         # Template
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.js
│       ├── pages/Dashboard.jsx
│       ├── components/alert/        # Header, SearchBar, Watchlist, AddAlertDialog,
│       │                            # Sparkline, TwilioBanner, AlertsHistory,
│       │                            # DailyBriefCard, SentimentChip
│       ├── lib/alertApi.js          # axios wrapper
│       └── lib/thresholdValidator.js
└── README.md
```

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| **Python** | 3.10+ | tested on 3.11 |
| **Node.js** | 18+ | comes with npm; this project uses **yarn** |
| **Yarn** | 1.22+ | `npm i -g yarn` |
| **MongoDB** | 5.0+ | local install **or** Docker **or** Atlas free tier |

> ⚠️ **Use Yarn, not npm.** The frontend lockfile is `yarn.lock`.

---

## 1. Clone & Install

```bash
git clone <your-repo-url> stockpulse
cd stockpulse
```

### 1a. Backend dependencies

```bash
cd backend
python -m venv .venv
source .venv/bin/activate            # macOS/Linux
# .venv\Scripts\activate              # Windows PowerShell

pip install -r requirements.txt
```

### 1b. Frontend dependencies

```bash
cd ../frontend
yarn install
```

---

## 2. Run MongoDB

Pick one:

**Option A — Docker (one-liner)**
```bash
docker run -d --name stockpulse-mongo -p 27017:27017 mongo:7
```

**Option B — Native install**
- macOS: `brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`
- Ubuntu: <https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/>
- Windows: <https://www.mongodb.com/try/download/community>

**Option C — MongoDB Atlas (free)**
Create a free cluster, whitelist your IP, copy the connection string.

---

## 3. Configure Environment

### 3a. `backend/.env`

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="stockpulse"
CORS_ORIGINS="http://localhost:3000"

# Twilio — leave blank to run in MOCK mode (alerts log to backend stdout)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_WHATSAPP_FROM=""

# Ollama AI features (Why-now, Daily Brief, Sentiment) — set AI_ENABLED=false to disable
OLLAMA_HOST="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"
AI_ENABLED="true"
```

> If you used Atlas in step 2, set `MONGO_URL="mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net"`.

### 3b. `frontend/.env`

```env
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=3000
```

---

## 4. (Optional) Twilio WhatsApp Setup

You can skip this and run with mocked alerts. To go live:

1. Create a free [Twilio account](https://www.twilio.com/try-twilio) (₹free credit included).
2. Activate the **WhatsApp Sandbox**: <https://www.twilio.com/console/sms/whatsapp/sandbox>.
3. From your phone, send the join keyword (shown in the sandbox page) to the Twilio number — e.g. `join silent-cloud` to `+14155238886`.
4. Copy these into `backend/.env`:
   ```env
   TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxx"
   TWILIO_AUTH_TOKEN="your_auth_token"
   TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"   # Twilio sandbox sender
   ```
5. Restart the backend (step 5).
6. In the app's UI, click **Set WhatsApp** in the banner and paste your number in E.164 (e.g. `+919999999999`).
7. Hit the **Refresh** button or wait for the scheduler — alerts now arrive on WhatsApp.

> **Costs**: Sandbox is free. Production WhatsApp ≈ ₹0.35–0.55 per utility message; 1,000 free service conversations/month from Meta.

---

## 5. (Optional) AI features with Ollama

The app ships with three AI features — all run **locally on your machine** via [Ollama](https://ollama.com), so:
- 🔒 No data leaves your laptop
- 💸 Zero API costs
- 🧠 Powered by **Llama 3.1 8B** by default (≈ 4.7 GB on disk)

If Ollama isn't running the app keeps working — AI features simply show *"AI offline"* states.

### 7a. Install Ollama

| OS | Command |
|---|---|
| macOS / Linux | `curl -fsSL https://ollama.com/install.sh \| sh` |
| Windows | Download installer from <https://ollama.com/download> |
| Docker | `docker run -d -p 11434:11434 -v ollama:/root/.ollama --name ollama ollama/ollama` |

### 7b. Pull the model & start the server

```bash
# One-time download (~4.7 GB)
ollama pull llama3.1:8b

# Start the local API server (runs on http://localhost:11434)
ollama serve
```

Verify it's reachable:
```bash
curl http://localhost:11434/api/tags
# Should return JSON listing 'llama3.1:8b'
```

### 7c. Configure the app

Already in `backend/.env` from step 3a:
```env
OLLAMA_HOST="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"
AI_ENABLED="true"
```

> **Want a smaller model?** `ollama pull llama3.2:3b` (~2 GB), then change `OLLAMA_MODEL="llama3.2:3b"`. Quality drops a bit, speed roughly doubles. Set `AI_ENABLED="false"` to turn the features off entirely.

### 7d. Restart the backend

```bash
# In your backend terminal: Ctrl+C, then re-run
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

You should see `AI` light up in the header (Klein-Blue pill instead of grey "AI OFF"). Sentiment chips on each watchlist row turn green/yellow/red within a few seconds.

### What each AI feature does

| Feature | Trigger | Output |
|---|---|---|
| **Why-now explainer** | Whenever an alert fires | A 1–2 sentence catalyst note based on recent yfinance headlines + price action. Appended to the WhatsApp message and shown italicized in the in-app Alert Log. |
| **Daily Market Brief** | Auto at 15:35 IST Mon–Fri (or click Generate manually) | 3-line summary of today's watchlist movers + outlook. Sent to WhatsApp + persisted at `/api/ai/briefs`. |
| **Sentiment chip** | On every watchlist row, refreshed hourly | 🟢 POS / 🟡 NEU / 🔴 NEG dot with hover tooltip showing AI summary + 2 latest headlines. Cached for 1h to keep Ollama load low. |

### AI endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/ai/health` | Probe Ollama + check model is pulled |
| GET | `/api/ai/sentiment/{symbol}` | Cached sentiment (add `?refresh=true` to bypass cache) |
| POST | `/api/ai/brief/preview` | Generate today's daily brief on-demand |
| GET | `/api/ai/briefs` | Recent persisted briefs |

### Performance notes
- First call after `ollama serve` is slower (model loads into RAM).
- Llama 3.1 8B uses **~6 GB RAM** while running. Keep at least 8 GB free.
- Apple Silicon / Nvidia GPU: throughput ~30–80 tok/s. CPU-only: 5–15 tok/s — still usable for these short prompts.

---

## 6. Run the App

Open **two terminal tabs**.

### Terminal 1 — Backend

```bash
cd backend
source .venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

You should see:
```
INFO  Scheduler started. Twilio configured: False
INFO  Application startup complete.
INFO  Uvicorn running on http://0.0.0.0:8001
```

API docs: <http://localhost:8001/docs>

### Terminal 2 — Frontend

```bash
cd frontend
yarn start
```

Opens <http://localhost:3000> automatically.

---

## 7. Try It

1. Search for a symbol (e.g. `RELIANCE`) → click the result
2. The dialog shows the live price, 30-day sparkline, and Day/30D/52W range bars
3. Pick **Price Below**, tap a quick chip (e.g. `-5%`), then **Create Alert**
4. Watchlist now shows the row with a distance-to-trigger pill (e.g. `−4.92%`)
5. Click **Refresh** to force a price check immediately
6. When the price actually breaches your threshold during market hours, you'll get a WhatsApp ping (or a console log if mocked)

---

## API Endpoints (cheat-sheet)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | health + twilio config |
| GET | `/api/market-status` | NSE open/closed + IST clock |
| GET | `/api/search?q=…` | autocomplete |
| GET | `/api/quote?symbol=…` | live price + ranges + 30-day sparkline |
| GET | `/api/watchlist` | list watchlist items |
| POST | `/api/watchlist` | create alert |
| PATCH | `/api/watchlist/{id}` | update alert |
| DELETE | `/api/watchlist/{id}` | remove alert |
| POST | `/api/watchlist/refresh` | manual price refresh + alert dispatch |
| GET | `/api/alerts` | recent alert log |
| GET | `/api/settings` | get destination number + twilio status |
| PUT | `/api/settings` | save destination WhatsApp number |
| GET | `/api/ai/health` | Ollama + model availability |
| GET | `/api/ai/sentiment/{symbol}` | Cached news sentiment for a symbol |
| POST | `/api/ai/brief/preview` | Generate daily brief on-demand |
| GET | `/api/ai/briefs` | Recent persisted daily briefs |

Full schema: <http://localhost:8001/docs>

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `No module named 'yfinance'` | Activate the venv, then `pip install -r requirements.txt` |
| Frontend can't reach backend | Check `REACT_APP_BACKEND_URL` matches the backend's host:port |
| `pymongo.errors.ServerSelectionTimeoutError` | MongoDB isn't running. `docker ps` or `brew services list` |
| Scheduler isn't firing | NSE market is **closed** (weekends or outside 09:15–15:30 IST). Use the **Refresh** button to test |
| WhatsApp not arriving | a) Twilio keys saved? b) You opted-in to the Sandbox keyword? c) Check `backend` stdout for `[MOCK WHATSAPP]` lines |
| `409 Same symbol + alert type already exists` | You already have that exact alert; edit or delete it first |
| yfinance returns `None` for a symbol | Yahoo rate-limit — wait 30s and retry |
| AI pill stuck on "AI OFF" | a) `ollama serve` running? b) `curl localhost:11434/api/tags` works? c) Model name in `.env` matches one of the listed tags? |
| Sentiment chips spinning forever | First Llama call is slow — model is loading into RAM. Wait 10–20 s. |
| Daily brief never sends | a) Did the 15:35 IST cron actually fire (check backend logs)? b) WhatsApp number set? c) Try `/api/ai/brief/preview` manually first |

---

## How It Works (60-second tour)

1. `nse_symbols.py` ships a hand-curated list of ~180 NSE symbols + 23 popular ETFs. Search is in-memory, so autocomplete is instant.
2. `fetch_quote_details()` calls yfinance for **1y** of daily data + **1d** of 5-min intraday → derives live price, day/30D/52W range, and a 30-day sparkline.
3. APScheduler cron `mon-fri, 9-15, */5` (IST) calls `_update_watchlist_prices_and_fire_alerts()`. The function double-guards with `is_market_open()` to ignore the 9:00 → 9:14 sliver and 15:31 → 15:59.
4. For every watchlist item: fetch price, run `_evaluate()` (below / above / pct_drop) — if the condition flipped from false → true, build the message, dispatch via Twilio, store an `AlertRecord`, set `triggered=True`. If the condition flips back to false later, `triggered` resets so the same alert can fire again.
5. The frontend polls `/api/market-status` every 30s for the live "Market Open / Closed" pill and updates the IST clock every 1s.

---

## License

MIT — do whatever you want.

## Credits

Made with ❤️ for retail Indian investors who'd rather not stare at charts all day.
