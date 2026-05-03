# Test Credentials

This project currently has **no authentication** (single-user app). No login required — the dashboard is publicly accessible.

- Auth: disabled
- Database: MongoDB (uses default `test_database` from backend/.env)
- WhatsApp destination: configurable via UI (stored in `settings` collection)
- Twilio credentials (backend/.env): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` — currently empty → backend runs in MOCK delivery mode (alerts logged to backend stdout instead of sent).
