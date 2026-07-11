# Lumanoris

**Lumanoris** is an AI chatbot marketplace platform. Users design, train and publish their own AI chatbots, chat with bots created by others, and buy, sell or subscribe to chatbots through an integrated wallet and payment system.

The repository is a monorepo with two applications:

| Path  | Stack                                   | Responsibility                                                                 |
| ----- | ---------------------------------------- | ------------------------------------------------------------------------------- |
| `web/` | Next.js 15 (App Router), React 19, Tailwind CSS | Customer-facing dashboard: chat, marketplace, wallet, notes, profile & settings |
| `api/` | PHP 8, MySQL/MariaDB                     | REST-style JSON API, authentication, payments, chatbot training/inference, legacy admin panel |

`web/` is not a plain static frontend — it runs behind a small Express server (`web/server.js`) that serves the Next.js app **and** proxies `/api`, `/admin` and `/assets` requests to the PHP backend, so both apps are reachable from a single origin in development and production alike.

## What you can do in the app

- **Create & train chatbots** — define a persona, upload training documents (PDF/OCR supported), generate a system prompt, and publish a bot to the marketplace.
- **Chat** — real-time conversations with bots, streamed responses (Server-Sent Events) powered by the Google Gemini API.
- **Marketplace** — explore, follow, like/comment, save to lists, buy or rent chatbots created by other sellers.
- **Wallet & payments** — card-based checkout (Param POS), withdrawal requests, seller onboarding, purchase history.
- **Personal workspace** — dialogue/notes history, custom lists, notifications, profile & account settings.
- **Admin panel** — legacy PHP admin UI for content, user and marketplace moderation.

## Tech stack

**Frontend** — Next.js 15 / React 19, Tailwind CSS, shadcn/ui-style components (Radix UI primitives), Lucide icons, Express (dev/prod server + proxy).

**Backend** — PHP 8.1+, PDO/MySQL, a layered (Controller → Service → Repository-ish) architecture under `api/src`, session-based auth, Google OAuth login, Param POS payment integration, Google Gemini for chat inference.

## Project structure

```
lumanoris-dashboard/
├── web/                      # Next.js frontend
│   ├── server.js             # Express entrypoint (Next.js + API/admin/assets proxy)
│   └── src/
│       ├── app/              # App Router pages (dashboard, login, register, ...)
│       ├── entities/         # Domain UI building blocks (bot, cart, user, ...)
│       ├── features/         # User-facing feature flows (chat, purchasing, wallet, ...)
│       ├── widgets/          # Composite layout pieces (sidebar, header, ...)
│       └── shared/           # Design-system primitives (Button, Dialog, Toast, ...)
│
└── api/                      # PHP backend
    ├── api/<domain>/*.php    # Thin HTTP entrypoints, one per endpoint
    ├── admin/                 # Legacy admin panel
    ├── src/
    │   ├── Presentation/Controllers/   # Auth, Chat, Chatbot, Marketplace, Wallet, ...
    │   ├── Shared/                      # Config, JSON response envelope, middleware
    │   └── autoload.php
    └── functions/             # DB access, rate limiting, bootstrap/session setup
```

## Prerequisites

- Node.js 18+ and npm
- PHP 8.1+ with the `pdo_mysql` extension
- Composer
- MySQL or MariaDB (database name `lumanoris` by default)

## Getting started

### 1. Backend (`api/`)

```bash
cd api
composer install
cp .env.example .env
```

Fill in `.env` with real values (Google OAuth client ID, mail credentials, Param POS secrets, etc.). By default the DB connection (`api/functions/db.php`) points at a local MySQL instance (`localhost:3306`, database `lumanoris`) — create the database, import your schema, then override `DB_HOST` / `DB_NAME` / `DB_USER` / `DB_PASS` in `.env` if your setup differs.

Start the PHP dev server from `api/`, using `router.php` so `/admin/*` routes resolve the same way they would under the real `.htaccess`:

```bash
php -S localhost:8000 router.php
```

The backend is now available at `http://localhost:8000` (e.g. `/api/social/likechatbot.php`, `/admin/...`).

### 2. Frontend (`web/`)

```bash
cd web
npm install
```

Check `web/.env` for the Param POS keys used by client-side checkout flows, then start the dev server:

```bash
npm run dev
```

This runs `server.js` (Express + Next.js) on `http://localhost:3000` and proxies any `/api`, `/admin` or `/assets` request to the PHP backend at `http://localhost:8000` (override with the `PHP_TARGET` env var if the backend runs elsewhere).

Open **[http://localhost:3000](http://localhost:3000)** — make sure the PHP server from step 1 is already running, or API calls will fail.

## Available scripts

Run from `web/`:

| Command          | Description                                   |
| ---------------- | ---------------------------------------------- |
| `npm run dev`     | Start the dev server (Next.js + Express proxy) |
| `npm run build`   | Production build (`next build`)                |
| `npm run start`   | Run the production build (`node server.js`)     |
| `npm run lint`    | Lint the frontend (`next lint`)                 |

## Admin panel

The legacy admin panel is served at `http://localhost:3000/admin` (proxied to `api/admin`). It authenticates against the `adminler` table via its own session flag, independent of regular user accounts.
