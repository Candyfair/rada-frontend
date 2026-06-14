# RADA — Renewable Assets Data Analytics — Frontend

A mobile-first React interface for monitoring a fleet of grid-scale energy assets (batteries, solar farms, wind turbines). Built as the frontend counterpart to the **[Renewable Assets Data Analytics backend](https://github.com/roadtowiganpier/grid-asset-manager)** developed by [Christian Baker](https://github.com/roadtowiganpier).

---

## Overview

This application provides:

- **Fleet dashboard** — interactive D3 bubble chart visualising all assets with real-time state-of-charge, operational mode, and dispatch status
- **Asset detail panel** — per-asset data including power, energy, voltage, current, temperature, and operational mode; slides up on bubble tap
- **Stats modal** — historical charts (Recharts) with asset comparison, configurable time range, and timezone-aware display (Europe/Paris)
- **Asset filtering** — filter the fleet by asset type (battery, solar, wind) with live metric toggle
- **Total power badge** — fleet-wide aggregated power output, updated per active filter
- **Dark mode** — full theme switching with CSS custom properties and localStorage persistence
- **Touch-optimised navigation** — designed for mobile devices, fully operable without a keyboard

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Language | JavaScript |
| Visualisation | D3.js (force simulation) |
| Charts | Recharts |
| Icons | Lucide React |
| Styling | CSS Modules + CSS custom properties |
| Fonts | Roboto Mono, Spectral (self-hosted, GDPR-compliant) |
| Deployment | Vercel |

---

## Architecture

All API calls are routed through **Next.js API Routes** acting as a server-side proxy. The backend API key is never exposed to the browser — it is injected server-side via environment variables before each request is forwarded to the VPS.

```
Browser  →  Vercel API Routes (/api/*)  →  Backend VPS
```

---

## Prerequisites

The backend must be accessible (locally or via network) before the frontend will return data. The API base URL and key are configured via environment variables — see below.

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/Candyfair/rada-frontend.git
cd rada-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

---

## Environment Variables

Create a `.env.local` file at the project root:

```
API_BASE_URL=http://your-backend-url
API_KEY=your-api-key
```

> **Important:** these variables have no `NEXT_PUBLIC_` prefix. They are server-only and never injected into the browser bundle.

---

## API Routes (Proxy)

All browser-facing API calls hit Next.js routes under `src/app/api/`. Each route injects the `X-API-Key` header and forwards the request to the backend.

| Route | Proxies to | Usage |
|---|---|---|
| `GET /api/assets` | `GET /assetslist` | Full asset fleet list |
| `GET /api/summary` | `GET /assets/summary` | Fleet-wide power and energy totals |
| `GET /api/asset-history` | `GET /assets/{id}/soc` | Single asset SoC — latest (`mode=S`) or history (`mode=D`) |

---

## Backend API Reference

The proxy routes forward to the following backend endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/assetslist` | All assets with latest StateOfCharge joined |
| `GET` | `/assets/summary` | Fleet totals broken down by asset type |
| `GET` | `/assets/{id}/soc` | Single asset SoC — `mode=S` (latest) or `mode=D` (history with optional `from_ts` / `to_ts`) |

---

## Project Structure

```
src/
├── app/          # Routes Next.js (App Router) + API proxy routes
├── components/   # UI components organised by domain
├── context/      # React contexts (theme, auth…)
├── hooks/        # Data-fetching hooks with polling
├── lib/          # Pure utilities (colours, dates, constants)
└── styles/       # CSS design tokens
```

---

## Deployment

The application is deployed on **Vercel**. Set the following environment variables in the Vercel dashboard before deploying:

| Variable | Description |
|---|---|
| `API_BASE_URL` | Full URL of the backend VPS |
| `API_KEY` | Backend API key (injected server-side only) |

No CORS configuration is required on the backend — all browser requests stay on the same Vercel origin. Only server-to-server calls reach the VPS.

---

## Development Notes

- **HMR from a physical device** — `allowedDevOrigins` in `next.config.mjs` is conditionally applied in `development` only. Update the IP if your local network changes.
- **Timezone strategy** — all timestamps are sent to and received from the API in UTC. Conversion to `Europe/Paris` happens only at display time.
- **Polling** — `useAssets` and `useFleetSummary` refresh every 5 minutes silently (no loading flash between polls).
- **10-minute bucketing** — `useAssetHistory` aligns records to 10-minute slots. Assets with lower reporting frequency may show gaps on long time ranges.

---

*RADA — Renewable Assets Data Analytics Frontend · Next.js · D3.js · Recharts · CSS Modules · Vercel · 2026*