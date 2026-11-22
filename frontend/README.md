# SUKI Frontend

React + Vite + TypeScript customer website and admin dashboard shell.

## Install and run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure:

```env
VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_APP_URL=https://loyalty.example.com
```

## Vercel

- Import the Git repository.
- Set Root Directory to `frontend`.
- Build Command: `npm run build`.
- Output Directory: `dist`.
- Add `VITE_API_BASE_URL` and `VITE_APP_URL` in Project Settings → Environment Variables.
- Redeploy after changing environment variables.

`vercel.json` contains an SPA rewrite for client-side routes.

## Current implementation status

- Implemented: redeem form connected to `POST /loyalty/redeem`.
- Implemented: public loyalty card connected to `GET /loyalty/cards/{token}`.
- Implemented: CSS card flip, floating, shine, stamp progress, and per-customer QR rendering on the card face.
- Scaffolded: admin login and overview API connection.
- Not yet implemented: customer CRUD UI, transaction form, QR scanner, reward redemption UI, wallet integration, email backup.

The UI uses temporary text/emoji artwork. Replace with the approved SUKI logo and production card assets.
