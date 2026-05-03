# StockPulse.in — Indian Stock & ETF Alert App (PRD)

## Original Problem Statement
Full-stack Stock & ETF Alert Application for Indian markets (NSE/BSE). Users search stocks/ETFs, add to a watchlist with a price threshold, and receive WhatsApp alerts when thresholds are crossed. Background scheduler runs every 5 minutes during NSE market hours. Twilio for WhatsApp, yfinance for prices, FastAPI + React.

## User choices (Feb 2026)
- Database: MongoDB (replaces SQLite in original spec)
- Auth: none (single-user)
- Alert types: below / above / pct_drop (all three)
- Scheduler respects NSE market hours (Mon–Fri 09:15–15:30 IST)
- Twilio: placeholder keys → MOCK delivery mode (alerts logged + persisted with status="mocked")

## Architecture
- Backend: FastAPI + Motor (MongoDB) + APScheduler (cron, Asia/Kolkata) + yfinance + Twilio SDK
- Frontend: React 19, Tailwind, shadcn/ui, Bricolage Grotesque + Plus Jakarta Sans + JetBrains Mono, Swiss/high-contrast theme
- Collections: `watchlist`, `alerts`, `settings` (singleton)

## Core Requirements (static)
1. Search NSE stocks/ETFs (curated ~180 symbols) with autocomplete
2. Add/update/delete alerts with below / above / pct_drop
3. Persist reference_price for pct_drop, flip on update, cascade delete alerts
4. 5-min scheduler: fetch price → evaluate condition → send WhatsApp (or mock) → persist alert + flip `triggered`
5. Reset `triggered` when condition no longer holds
6. Pause scheduler outside NSE hours; manual refresh bypasses time gating
7. E.164 validation on destination WhatsApp number

## User Persona
Retail Indian equity/ETF investor who wants hands-off, cross-threshold WhatsApp pings without staring at charts.

## Implemented (2026-02-03)
- Backend endpoints: `/api/health`, `/api/market-status`, `/api/search`, `/api/watchlist` (GET/POST/PATCH/DELETE), `/api/watchlist/refresh`, `/api/alerts`, `/api/settings` (GET/PUT)
- APScheduler cron (mon-fri, 9-15, every 5 min IST) with `is_market_open` guard
- Twilio WhatsApp integration (MOCKED when creds empty)
- yfinance intraday price fetch with 1d fallback
- Frontend: Header + IST clock + Market pill, Hero, Twilio banner with geometric bg image, Autocomplete search + Add-Alert dialog, Watchlist table (mono prices, flash up/down, inline edit/delete, ARMED/TRIGGERED pills), Alert log
- 14/14 backend pytest tests passing, full frontend E2E verified

## Backlog
### P1
- Deliver alerts via Email + Telegram as fallbacks
- Per-symbol multiple alerts (relax 409 to allow same symbol with different thresholds under different alert_types — currently allowed only across types)
- Historical chart for a watchlist item (recharts sparkline)
- JWT auth + per-user watchlists

### P2
- NSE full universe import (bhavcopy) instead of curated list
- Alert frequency throttle (daily digest)
- Push notifications (web push) for offline alerts
- Portfolio positions + P&L view

## Next Tasks
- Ask user for Twilio credentials to flip from MOCK → live delivery
- Optionally expand NSE symbol universe to cover 2000+ tickers via bhavcopy CSV
