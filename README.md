# RADA — Renewable Assets Data Analytics — Frontend

[![CI](https://github.com/OpenFoundationRenewableOperationGrids/rada-frontend/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/OpenFoundationRenewableOperationGrids/rada-frontend/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

A mobile-first web interface for monitoring a fleet of grid-scale energy assets (batteries, solar farms, wind turbines). It is the frontend of the **[RADA backend](https://github.com/OpenFoundationRenewableOperationGrids/rada-backend)** developed by [Christian Baker](https://github.com/roadtowiganpier), and part of the [Open Foundation for Renewable Operation Grids](https://github.com/OpenFoundationRenewableOperationGrids).

---

## Overview

This application provides:

- **Fleet dashboard** — interactive D3 bubble chart visualising all assets with real-time state-of-charge, operational mode, and dispatch status
- **Asset detail panel** — per-asset data including power, energy, voltage, current, temperature, and operational mode; slides up on bubble tap
- **Stats modal** — historical charts (Recharts) with asset comparison, configurable time range, and timezone-aware display (Europe/Paris)
- **Asset filtering** — filter the fleet by asset type (battery, solar, wind) with live metric toggle
- **Total power badge** — fleet-wide aggregated power output, updated per active filter
- **Dark mode** — full theme switching with CSS custom properties and localStorage persistence
- **Touch-optimised navigation** — designed for phones, iPhone first
- **Accessibility mode** — opt-in keyboard and screen-reader support for the bubble map, without changing the touch experience for other users

---

## Tech Stack

| Layer         | Choice                                              |
| ------------- | --------------------------------------------------- |
| Framework     | Next.js (App Router), React 19                      |
| Language      | TypeScript (strict)                                 |
| Visualisation | D3.js (force simulation)                            |
| Charts        | Recharts                                            |
| Icons         | Lucide React                                        |
| Styling       | CSS Modules + CSS custom properties                 |
| Fonts         | Roboto Mono, Spectral (self-hosted, GDPR-compliant) |
| Tests         | Vitest + Testing Library, Playwright                |
| CI            | GitHub Actions                                      |
| Deployment    | Vercel                                              |

---

## Architecture

All API calls are routed through **Next.js API Routes** acting as a server-side proxy. The backend API key is never exposed to the browser — it is injected server-side via environment variables before each request is forwarded to the VPS.

```
Browser  →  Vercel API Routes (/api/*)  →  Backend VPS
```

---

## Getting Started

You need Node.js 24 (see `.nvmrc`). The backend must be reachable for the app to show data; the tests don't need it.

```bash
# Clone the repository
git clone https://github.com/OpenFoundationRenewableOperationGrids/rada-frontend.git
cd rada-frontend

# Install dependencies
npm install

# Configure the backend (see below)
cp .env.local.example .env.local

# Start the development server
npm run dev
```

---

## Environment Variables

Set them in `.env.local` at the project root:

| Variable              | Required | Description                                                                                                    |
| --------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `API_BASE_URL`        | yes      | Full URL of the backend, with the protocol (`https://…`)                                                       |
| `API_KEY`             | yes      | Backend API key, sent server-side only as `X-API-Key`                                                          |
| `ALLOWED_DEV_ORIGINS` | no       | Comma-separated LAN addresses allowed to use the dev server, e.g. to test on a phone on the same Wi-Fi network |

> **Important:** these variables have no `NEXT_PUBLIC_` prefix. They are server-only and never injected into the browser bundle.

---

## Scripts

| Command                       | Description                             |
| ----------------------------- | --------------------------------------- |
| `npm run dev`                 | Development server                      |
| `npm run build` / `npm start` | Production build and server             |
| `npm run lint`                | ESLint + Prettier (no warnings allowed) |
| `npm run typecheck`           | TypeScript check                        |
| `npm test`                    | Unit and component tests (Vitest)       |
| `npm run test:coverage`       | Unit tests with coverage                |
| `npm run test:e2e`            | End-to-end tests (Playwright)           |

---

## Tests

```bash
# Unit and component tests (Vitest)
npm test

# End-to-end tests (Playwright): iPhone (WebKit), Android and desktop (Chromium)
npx playwright install chromium webkit   # once
npm run test:e2e
```

The end-to-end tests build the app and run it against a mock backend (`e2e/mock-backend.mts`) that serves the fixtures of `src/__fixtures__`. They need neither the real backend nor an API key, and never use the values of `.env.local`.

CI runs the lint, typecheck, unit tests, build and end-to-end tests on every push and pull request to `main` and `develop`.

---

## API Routes (Proxy)

All browser-facing API calls hit Next.js routes under `src/app/api/`. Each route injects the `X-API-Key` header and forwards the request to the backend.

| Route                    | Proxies to             | Usage                                                      |
| ------------------------ | ---------------------- | ---------------------------------------------------------- |
| `GET /api/assets`        | `GET /assetslist`      | Full asset fleet list                                      |
| `GET /api/summary`       | `GET /assets/summary`  | Fleet-wide power and energy totals                         |
| `GET /api/asset-history` | `GET /assets/{id}/soc` | Single asset SoC — latest (`mode=S`) or history (`mode=D`) |

---

## Backend API Reference

The proxy routes forward to the following backend endpoints:

| Method | Endpoint           | Description                                                                                  |
| ------ | ------------------ | -------------------------------------------------------------------------------------------- |
| `GET`  | `/assetslist`      | All assets with latest StateOfCharge joined                                                  |
| `GET`  | `/assets/summary`  | Fleet totals broken down by asset type                                                       |
| `GET`  | `/assets/{id}/soc` | Single asset SoC — `mode=S` (latest) or `mode=D` (history with optional `from_ts` / `to_ts`) |

---

## Project Structure

```
src/
├── __fixtures__/ # Sample API responses, shared by unit and E2E tests
├── app/          # Next.js routes (App Router) + API proxy routes
├── components/   # UI components organised by domain
├── context/      # React contexts (theme, accessibility)
├── hooks/        # Data-fetching hooks with polling
├── lib/          # Pure utilities (colours, dates, constants, backend proxy)
├── styles/       # CSS design tokens
└── types/        # API types
e2e/              # Playwright tests and mock backend
```

---

## Deployment

The application is deployed on **Vercel**: `main` is production, and every other branch gets a preview. Set `API_BASE_URL` and `API_KEY` in the Vercel dashboard (see [Environment Variables](#environment-variables)).

No CORS configuration is required on the backend — all browser requests stay on the same Vercel origin. Only server-to-server calls reach the VPS.

---

## Development Notes

- **Testing on a phone** — set `ALLOWED_DEV_ORIGINS` to your computer's LAN address, then open `http://<that-address>:3000` on the phone. Applied in `development` only.
- **Timezone strategy** — all timestamps are sent to and received from the API in UTC. Conversion to `Europe/Paris` happens only at display time, and never depends on the device's timezone.
- **Polling** — `useAssets` and `useFleetSummary` refresh every 5 minutes silently (no loading flash between polls).
- **10-minute bucketing** — `useAssetHistory` aligns records to 10-minute slots. Assets with lower reporting frequency may show gaps on long time ranges.

---

## Contributing

Contributions are welcome! Read [CONTRIBUTING.md](CONTRIBUTING.md) to get started. Pull requests target `develop`.

To report a security issue, follow [SECURITY.md](SECURITY.md) — please don't open a public issue.

---

## License

Copyright 2026 openfrog.org

Licensed under the [Apache License, Version 2.0](LICENSE).
