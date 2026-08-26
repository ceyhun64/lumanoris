# Lumanoris

AI chatbot marketplace. Users create and train chatbots, chat with them, and list them for sale as
time-limited subscriptions that other users can buy.

The repository holds two applications that are always run together: a Next.js frontend (`web/`) and a
PHP backend (`api/`) that also contains a separate server-rendered admin panel.

## Overview

| Path   | Stack                                              | Responsibility                                                                        |
| ------ | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `web/` | Next.js 15 (App Router), React 19, Tailwind CSS 3   | Dashboard UI — chat, marketplace, cart/checkout, wallet, notes, lists, settings         |
| `api/` | PHP 8.1+, PDO/MySQL                                 | JSON API (one `.php` file per endpoint), session auth, chat inference proxy, admin panel |

`web/` is not a static frontend. `web/server.js` runs an Express process that wraps the Next.js
request handler and proxies `/api`, `/admin` and `/assets` to the PHP backend, so both applications
answer on a single origin (`http://localhost:3000`) in development.

> [!IMPORTANT]
> Several backend subsystems in this repository are explicitly labelled **development stubs** in
> their own source files: payment charging and reconciliation, the Param POS marketplace client,
> transactional email, producer-plan purchase/status, and plan-based chatbot limits. See
> [Development stubs](#development-stubs) before assuming any payment, email or plan behaviour works
> end to end.

## Features

Each item below is backed by routes and endpoints that exist in this repository.

- **Chatbot authoring and training** — `web/src/features/chatbot-mgmt/ChatbotForm.jsx` collects a
  persona, style prompt, greeting, category and cover/profile images. Uploaded images are OCR'd in
  the browser with `tesseract.js`; uploaded PDFs are posted to `/api/training/readpdf.php` and parsed
  server-side with `smalot/pdfparser`. Extracted text is written to the bot's `training_prompt` in
  chunks via `/api/training/update_training_chunk.php`.
- **Chat with streaming replies** — `/api/chat/generatereply.php` proxies to the Google Gemini
  `streamGenerateContent` endpoint (`gemini-3-flash-preview`, `alt=sse`) and relays the raw SSE stream
  to the browser. Conversations, messages and history are stored in MySQL.
- **Message allowance ("coin") system** — 10 free messages per day per user, plus per-bot bonus
  credits granted on purchase. Implemented in `api/functions/coin_engine.php`; consumption is atomic
  (`UPDATE ... WHERE remaining > 0`).
- **Marketplace and social graph** — explore/discover pages, categories, like, dislike, follow,
  comment, report, hide, "not interested", and user-defined bot lists.
- **Cart, checkout and subscriptions** — cart endpoints plus
  `/api/marketplace/createsubscription.php`, which runs inside a DB transaction: it creates
  `user_subscriptions` rows, grants purchase credits, clears the cart, then validates/charges the
  card and writes payment rows. Any failure rolls the whole thing back.
- **Wallet and seller onboarding** — balance, payment history, subscriptions, IBAN/bank details,
  withdrawal requests, and a Param POS sub-merchant registration wizard.
- **Notes / dialogue books** — saving and sharing conversation excerpts, with likes and comments.
- **Admin panel** — a separate server-rendered PHP UI at `/admin` for users, chatbots, categories,
  SEO, SMTP, API keys, and content pages.

## Technology Stack

### Frontend runtime dependencies (verified as imported)

| Package | Used for |
| --- | --- |
| `next` 15.5.20, `react` / `react-dom` 19 | App Router application |
| `express` 5, `http-proxy-middleware` 4 | `web/server.js` — custom server + PHP proxy |
| `tailwindcss` 3.4, `tailwindcss-animate`, `postcss`, `autoprefixer` | Styling |
| `@radix-ui/react-*` (avatar, checkbox, dialog, dropdown-menu, select, separator, slot, switch, tabs, toast, tooltip) | shadcn/ui-style primitives in `web/src/shared/ui/` |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Variant + class-name composition (`web/src/lib/utils.js`) |
| `lucide-react` | Icons |
| `react-markdown` | Rendering assistant replies in `web/src/app/dashboard/chat/page.jsx` |
| `tesseract.js` | Client-side OCR (dynamically imported in `ChatbotForm.jsx`) |

> [!NOTE]
> These declared dependencies were **not** found imported anywhere under `web/src`:
> `@radix-ui/react-label`, `@radix-ui/react-scroll-area`, `@react-oauth/google`,
> `@splidejs/react-splide`, `@splidejs/splide`, `date-fns`, `framer-motion`, `pdfjs-dist`,
> `react-icons`, `react-masonry-css`, `sharp`.
> Google sign-in is implemented directly against the Google Identity Services script
> (`https://accounts.google.com/gsi/client`) in `web/src/app/login/page.jsx`, not via
> `@react-oauth/google`.

### Frontend dev tooling

`eslint` 9 + `eslint-config-next` (flat config in `web/eslint.config.mjs`), `nodemon` (watches
`server.js` only), `concurrently` (used by the `dev:all` script).

### Backend

| Component | Detail |
| --- | --- |
| PHP | `>=8.1` required by `api/composer.json` |
| Database | MySQL/MariaDB via PDO (`utf8mb4`, `ERRMODE_EXCEPTION`, emulated prepares off) |
| `google/apiclient` 2.19 | Verifying Google ID tokens in `AuthController::loginGoogle` |
| `smalot/pdfparser` 2.12 | Server-side PDF text extraction |
| `vlucas/phpdotenv` (separate `api/admin/composer.json`) | Reads `api/admin/.env` for the admin API-keys page |
| Google Gemini REST API | Chat inference, called with cURL from `ChatController::generateReply` |

There is no Docker, CI, or test tooling of any kind in this repository.

## Architecture

### Request path

```
browser → http://localhost:3000
            │
            ├─ /api/*, /admin/*, /assets/*  → http-proxy-middleware → PHP_TARGET (default http://127.0.0.1:8000)
            └─ everything else              → Next.js request handler
```

`next.config.mjs` additionally declares `rewrites()` for the same three prefixes, so the routing also
works when the app runs under `next start` or a platform that ignores `server.js`. Those rewrites are
active only when `PHP_TARGET` is set, and are skipped entirely in static-export mode.

No `assets` directory currently exists under `api/`, and no code under `web/src` requests an
`/assets/...` URL — that proxy rule is currently unused.

### Backend layering

Every file under `api/api/` is a three-line entrypoint: require `src/autoload.php`, then call one
static controller method. `api/src/autoload.php` boots `functions/bootstrap.php` (JSON header,
session, `.env` parsing, PDO connection, response helpers, global exception → JSON handler),
`validators.php` and `rate_limit.php`, then registers a filename-based autoloader that searches a
fixed list of directories.

```
Presentation/Controllers  →  Application/UseCases  →  Infrastructure/Repositories  →  Database (PDO)
                          ↘  Presentation/Response/JsonResponse
                          ↘  Presentation/Middleware/AuthMiddleware
```

> [!WARNING]
> The layering is only partially applied. Use cases exist for auth only
> (`Application/UseCases/Auth/`); every other controller talks to `Database` or a repository
> directly. `Domain/Interfaces/` declares eight repository interfaces (cart, chat, chatbot,
> notification, social, subscription, user, wallet), but only two implementations exist —
> `ChatbotRepository` and `UserRepository`, both extending `BaseRepository` and implementing their
> interface. The other six interfaces have no implementation.

> [!WARNING]
> Some classes exist twice, and the autoloader's directory order decides which one wins:
> `AppConfig` (`Shared/Constants/` wins over `Config/`), `AuthMiddleware` (`Presentation/Middleware/`
> wins over `Middleware/`) and `AppException` (`Shared/Exceptions/` is loaded unconditionally).
> `src/Exceptions/` is not in the autoloader's search list at all, so it is unreachable. Editing the
> losing copy has no effect.

## Folder Structure

```
lumanoris-dashboard/
├── package.json              # root shim — every script delegates to web/
├── autostart.bat             # Windows helper: opens two terminals (PHP + Next.js)
├── TODO.md                   # stale scratch notes for a ChatbotForm refactor
├── docs/                     # audit reports (docs/audit/) and scope notes
├── storage/                  # runtime artefacts, OUTSIDE the document root, gitignored
│   ├── db_backup/            #   mysqldump output (was api/admin/db_backup/ — see SEC-001)
│   └── logs/                 #   php-error.log (was api/admin/error_log)
│
├── web/
│   ├── server.js             # Express + Next.js + PHP proxy (PORT/HOST env, /healthz, graceful shutdown)
│   ├── next.config.mjs       # static-export toggle, rewrites, security headers, image config
│   ├── tailwind.config.js    # "Lumanoris Elite" dark palette + typography scale
│   ├── components.json       # shadcn/ui generator config (style: new-york, tsx: false)
│   ├── scripts/phpify.js     # copies web/src/php → web/out (source dir does not exist)
│   ├── public/               # static assets, incl. robots.txt; public/api/*.php are orphaned
│   └── src/
│       ├── app/              # App Router pages
│       ├── entities/         # Domain-object UI (chatbot cards, user profile cards)
│       ├── features/         # Feature flows (chat, purchasing, wallet, seller, settings, …)
│       ├── widgets/          # Sidebar, DashboardHeader, Navbar, info popups
│       ├── shared/           # ui/ primitives, api/client.js, hooks, contexts, lib helpers
│       ├── lib/utils.js      # cn() helper
│       ├── images/, font/    # imported assets
│       └── app/css/          # global.css (imported), global.scss + .map (see note below)
│
└── api/
    ├── .htaccess             # document-root denylist (.env, dumps, logs, src/, vendor/)
    ├── router.php            # dev-server router: same denylist + admin pretty URLs
    ├── composer.json         # google/apiclient, smalot/pdfparser
    ├── .env.example
    ├── api/<domain>/*.php    # endpoint entrypoints (3 lines each) + index.php 404 fallback
    ├── assets/               # user-uploaded images (.htaccess disables script execution)
    ├── database/
    │   ├── schema.sql        #   50 tables, utf8mb4_general_ci throughout
    │   ├── migrations/       #   001–004, applied in filename order
    │   └── migrate.php       #   runner: dry-run by default, records schema_migrations
    ├── functions/            # bootstrap, env, logging, db, rate limit, mailer, coin engine, stubs
    ├── src/                  # Presentation / Application / Domain / Infrastructure / Shared
    └── admin/                # server-rendered admin panel (own composer.json + .env + .htaccess)
```

Notes on files a newcomer will trip over:

- `web/public/api/get_bank_info.php` and `save_bank_info.php` `require '../../php/functions/db.php'`,
  a path that does not exist in this repository. They are also unreachable at runtime, because the
  proxy sends every `/api/*` request to the PHP backend before Next.js sees it.
- `web/src/app/css/global.css` (805 lines) is the file imported by `app/layout.js`.
  `global.scss` (11,000 lines) and `global.css.map` are leftovers — no Sass compiler is configured in
  `web/package.json` and nothing imports the `.scss`.
- `web/src/app/auth/page.jsx` and `web/src/app/dashboard/market/page.jsx` deliberately call
  `notFound()` — they are retired routes kept as explicit 404s.
## Installation

### Prerequisites

| Requirement | Verified from |
| --- | --- |
| PHP 8.1+ with `pdo_mysql` and `curl` | `api/composer.json`; PDO/cURL usage in `functions/db.php`, `ChatController` |
| Composer | `api/composer.lock`, `api/admin/composer.lock` |
| MySQL or MariaDB | `Database` builds a `mysql:` DSN |
| Node.js + npm | `web/package-lock.json` (lockfileVersion 3) |

No Node or PHP version is pinned anywhere in the repository (no `engines` field, no `.nvmrc`, no
`platform` block in `composer.json`).

### 1. Backend

```bash
cd api
composer install
cp .env.example .env
```

The admin panel has its own dependency tree and its own env file:

```bash
cd api/admin
composer install
```

`API_GOOGLE_GEMINI` (the Gemini key used for chat inference) belongs in `api/admin/.env` — that is
the file the admin panel's "API Entegrasyonları" page writes, and `AppConfig::googleGeminiApiKey()`
parses it directly as a fallback. It first checks `$_ENV` / `getenv()`, so setting the variable in
`api/.env` also works, because `functions/bootstrap.php` loads that file into both.

### 2. Database

The schema and migrations **are** in version control (`api/database/`). A fresh install is:

```bash
# 1. Create an empty database
mysql -u root -p -e "CREATE DATABASE lumanoris CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci"

# 2. Load the schema (50 tables)
mysql -u root -p lumanoris < api/database/schema.sql

# 3. Review, then apply migrations (dry-run first — this is the default)
php api/database/migrate.php
php api/database/migrate.php --apply
```

> [!WARNING]
> `002_clean_orphan_rows.sql` **deletes and rewrites data** — it removes rows orphaned by the
> years the schema ran without foreign keys, so that `003_add_foreign_keys.sql` can succeed.
> Read it before running it. The runner refuses to execute it unless you also pass
> `--allow-destructive`.

The runner records what it applied in `schema_migrations`, so re-running it is safe, and it stops
at the first failure rather than continuing out of order.

Credentials come from `api/.env` (`DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`). All four are
required — `db.php` no longer carries hard-coded development credentials and will fail loudly
rather than connect somewhere unintended.

### 3. Frontend

```bash
cd web
npm install
```

`web/.env` is required for Google sign-in (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`). No `web/.env.example`
exists.

## Environment Variables

### `api/.env` — loaded by `functions/bootstrap.php` into `$_ENV` and `putenv()`

| Variable | Read by | Purpose |
| --- | --- | --- |
| `APP_DEBUG` | `functions/bootstrap.php` | When `true`, the global exception handler returns the real exception message instead of a generic one. Leave false outside local dev. |
| `GOOGLE_CLIENT_ID` | `AppConfig::googleClientId()` | Audience for verifying Google ID tokens on `/api/auth/login-google.php`. |
| `CONTACT_EMAIL` | `AppConfig::contactEmail()` | Recipient for contact-form mail. Falls back to a hard-coded address. |
| `NOREPLY_EMAIL` | `AppConfig::noreplyEmail()` | Sender for password-reset mail. Falls back to a hard-coded address. |
| `PARAM_RECONCILE_SECRET` | `SellerController::reconcile()` | Shared secret required (via `?secret=`, POST `secret`, or `X-Reconcile-Secret`) to run the reconciliation endpoint. If unset, the endpoint always returns 403. |
| `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` | `functions/db.php` | Optional. Each one that is non-empty overrides the corresponding hard-coded development default. `DB_HOST` accepts `host:port`. |

> [!CAUTION]
> `api/functions/db.php` contains hard-coded development database credentials, including a plaintext
> password, that are used whenever the matching `DB_*` variable is empty. Set all four `DB_*`
> variables in any non-local environment.

### `api/admin/.env` — loaded by `vlucas/phpdotenv` in `admin/api.php`

| Variable | Purpose |
| --- | --- |
| `API_GOOGLE_GEMINI` | Google Gemini API key used for chat inference. Server-side only; never sent to the browser. |

### `web/.env`

| Variable | Read by | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `web/src/app/login/page.jsx` | Client ID passed to `google.accounts.id.initialize`. Without it the Google button shows an error toast. |
| `PHP_TARGET` | `web/server.js`, `web/next.config.mjs` | Backend origin for the proxy/rewrites. `server.js` defaults to `http://127.0.0.1:8000`; `next.config.mjs` emits no rewrites when it is unset. |
| `NEXT_EXPORT` | `web/next.config.mjs` | When `1`, switches the build to `output: 'export'` with unoptimized images and no rewrites. |
| `NODE_ENV` | `web/server.js` | Anything other than `production` starts Next.js in dev mode. |

> [!NOTE]
> The `web/.env` file in this working tree also defines `PARAM_CLIENT_CODE`, `PARAM_CLIENT_USERNAME`,
> `PARAM_CLIENT_PASSWORD`, `PARAM_GUID`, `PARAM_MARKETPLACE_GUID`, `PARAM_PAYMENT_WSDL`,
> `PARAM_MARKETPLACE_WSDL`, `PARAM_PAYMENT_SECURITY_TYPE`, `PARAM_REF_URL`, `PARAM_SUCCESS_URL` and
> `PARAM_FAIL_URL`. A search of the whole repository finds no code that reads any of them. They
> appear to belong to the production Param POS implementation, which is not in this repository.

## Available Scripts

### Root `package.json`

Every root script is a shim that runs the identically named script in `web/`.

| Script | Runs |
| --- | --- |
| `npm run dev` | `cd web && npm run dev` |
| `npm run build` | `cd web && npm run build` |
| `npm start` | `cd web && npm start` |
| `npm run lint` | `cd web && npm run lint` |

### `web/package.json`

| Script | Command | Notes |
| --- | --- | --- |
| `dev` | `nodemon server.js` | Express + Next.js dev server. `nodemon.json` watches only `server.js`; Next.js handles its own hot reload for `src/`. |
| `dev:all` | `concurrently -k -n web,api -c blue,green "npm run dev" "cd ../api && php -S 127.0.0.1:8000 router.php"` | Starts both processes in one terminal. |
| `build` | `next build` | Verified working — produces 22 static-prerendered routes. |
| `start` | `node server.js` | Does **not** set `NODE_ENV`; without `NODE_ENV=production` it starts Next.js in dev mode. |
| `lint` | `next lint` | Verified passing. Prints a deprecation warning — `next lint` is removed in Next.js 16. |
| `export` | `next export` | **Broken.** Verified by execution: Next.js 15 removed this command in favour of `output: 'export'`. Use `NEXT_EXPORT=1 npm run build` instead. |
| `phpify` | `node scripts/phpify.js` | **Broken.** It copies `web/src/php` to `web/out`; `web/src/php` does not exist, so the script exits 1. |

### Destructive operations

> [!CAUTION]
> `api/admin/ajax/db_backup.php` with `mode=restore` calls `Database::restore()`, which pipes the
> newest backup file into `mysql`, overwriting the live database. `mode=backup` shells out to
> `mysqldump`.
>
> Both now require **POST + a valid CSRF token + an authenticated admin session**, and `restore`
> additionally requires an explicit `confirm=RESTORE` field. It used to be reachable by `GET`, so a
> link, a prefetch, an `<img src>` or a crawler could trigger a full database overwrite with no
> confirmation step at all.
>
> Backups are written **outside the document root** — the repo-root `storage/db_backup/` by default,
> overridable with `DB_BACKUP_DIR`. They previously lived in `api/admin/db_backup/`, where
> `GET /admin/db_backup/<file>.sql` returned a full dump (every e-mail address and bcrypt hash)
> with no authentication. `Database::backupDir()` now refuses any configured path that resolves
> inside `api/`.
>
> `Database::truncate()` also exists but is not called anywhere in the repository.

## Development

Two processes must run. Start the backend first — the frontend has no fallback data.

**Terminal 1 — PHP backend, from `api/`:**

```bash
cd api
php -S 127.0.0.1:8000 router.php
```

`router.php` must be used. It replicates `admin/.htaccess`: real files and directories are served
as-is, and anything else under `/admin` is routed to `admin/index.php`, which is how the admin
panel's pretty URLs (`/admin/seo`, `/admin/kullanicilar`, …) resolve.

`router.php` also carries a denylist that the built-in server has no other way to enforce (there is
no `.htaccess` support in `php -S`): `.env`, `error_log`, `db_backup/`, `*.sql`, `composer.json`,
dotfiles, and the `src/`, `vendor/`, `migrations/`, `database/` directories all return 404. Requests
containing `..` are rejected before any path resolution. The Apache equivalents live in
`api/.htaccess` and `api/admin/.htaccess` — **change all three together.**

**Terminal 2 — frontend, from `web/`:**

```bash
cd web
npm run dev
```

Or start both at once with `npm run dev:all` from `web/`.

Open <http://localhost:3000>. `/` redirects to `/dashboard`; `/register` redirects to
`/login?tab=register`.

`autostart.bat` at the repository root opens both terminals on Windows. It starts the backend as
`php -S 127.0.0.1:8000 router.php` from inside `api/`, which is the correct command — the earlier
note that it omitted `router.php` no longer applies.

### Routes

| Route | Access |
| --- | --- |
| `/` | Redirects to `/dashboard` |
| `/login` | Public — login and register tabs, plus Google sign-in |
| `/register` | Redirects to `/login?tab=register` |
| `/forgot-password` | Public — email code request, then password reset |
| `/dashboard` and `/dashboard/{chat, chatbots, chatbots/create, checkout, explore, following, history, list, notes, purchased, settings, upgrade, wallet}` | Guarded by `web/src/app/dashboard/layout.jsx` |
| `/auth`, `/dashboard/market` | Retired — return 404 |
| `/admin` | Proxied to the PHP admin panel |

## Build

```bash
cd web
npm run build     # next build
NODE_ENV=production node server.js
```

Static-export mode is also supported:

```bash
cd web
NEXT_EXPORT=1 npm run build
```

This sets `output: 'export'` and `images.unoptimized`, and disables the rewrites — the exported
output must then be served behind something that routes `/api` and `/admin` to PHP itself.

`app/layout.js` sets `export const dynamic = 'force-static'`, so all 22 routes prerender as static
content and every data fetch happens client-side.

## Deployment

Only what the repository itself shows is documented here.

- `web/server.js` hard-codes `server.listen(3000, '127.0.0.1')`. There is no `PORT` variable, and the
  loopback bind means a reverse proxy must sit in front of it.
- `npm start` does not set `NODE_ENV=production`. The repository-root `customserver.txt` records an
  alternative `start` script that does (`NODE_ENV=production node server.js`), but that script is not
  in `web/package.json`.
- `next.config.mjs` comments state the `rewrites()` block exists specifically because Vercel does not
  run a custom server. `PHP_TARGET` must point at the real backend origin in that setup.
- `api/admin/.htaccess` implies Apache with `mod_rewrite` for the admin panel in production.

The actual hosting platform, process manager, TLS termination, and PHP deployment method could not be
verified from the repository.

## API

### Conventions

- Endpoints are physical files. The URL is the file path: `/api/<domain>/<file>.php`.
- Most `POST` endpoints expect `multipart/form-data` with a single field named `data` containing a
  JSON string. `web/src/shared/api/client.js` builds exactly that shape; most pages build it inline
  with `FormData`. Some endpoints differ: `/api/training/readpdf.php` reads a raw JSON body, and
  `/api/auth/passresetmail.php` and `/api/auth/updateuserpass.php` read plain `$_POST` fields.
- Success responses are `{"success": true, ...payload}`; errors are
  `{"success": false, "message": "...", "error_code": "..."}` (`JsonResponse`). Error codes come from
  `AppConfig::ERR_*`: `VALIDATION_ERROR`, `AUTH_REQUIRED`, `NOT_FOUND`, `PERMISSION_DENIED`,
  `LIMIT_REACHED`, `DUPLICATE_ENTRY`, `PAYMENT_ERROR`, `SERVER_ERROR`.
- Not every endpoint uses the envelope. `ContentController` methods and
  `ChatController::getConversation` bypass `JsonResponse` and `echo` their payload directly:
  `/api/content/getcategories.php` returns a plain array, and `getconversation.php` returns a bare
  row object with no `success` key. `/api/auth/sessioncheck.php` returns `{"authenticated": false}`
  when signed out. `UserController::getProfilePhoto` also echoes directly, but keeps the
  `success` key.
- Status codes observed: `401` with `AUTH_REQUIRED` for a protected endpoint without a session,
  `405 {"success":false,"message":"Method not allowed"}` for a wrong verb, `429` from the rate
  limiter, `500` from the global exception handler, and `404` for any unmatched `/api/**` path
  (`api/api/index.php`).
- `/api/chat/generatereply.php` is the one non-JSON endpoint: it sets
  `Content-Type: text/event-stream` and streams Gemini's SSE response through unmodified.

The **Auth** column below is derived from the guard each controller method calls: `user` =
`AuthMiddleware::requireAuth()`, `optional` = `optionalAuth()` (works signed-out, personalises when
signed in), `admin` = `requireAdmin()` (the `$_SESSION['admin']` flag set by the admin panel), `none`
= no guard. `GET/POST` means the handler calls no `require_method()`.

### auth

| Endpoint | Method | Auth |
| --- | --- | --- |
| `/api/auth/register.php` | POST | none |
| `/api/auth/login.php` | POST | none |
| `/api/auth/login-google.php` | GET/POST | none |
| `/api/auth/logout.php` | GET/POST | optional |
| `/api/auth/sessioncheck.php` | GET/POST | optional |
| `/api/auth/passresetmail.php` | POST | none |
| `/api/auth/updateuserpass.php` | POST | none |

### chat

| Endpoint | Method | Auth |
| --- | --- | --- |
| `/api/chat/addchat.php` | POST | user |
| `/api/chat/addconversation.php` | POST | user |
| `/api/chat/updateconversation.php` | POST | user |
| `/api/chat/deleteconversation.php` | POST | user |
| `/api/chat/generatereply.php` | POST | user |
| `/api/chat/getchat.php` | GET/POST | user |
| `/api/chat/getconversation.php` | GET/POST | user |
| `/api/chat/gethistory.php` | GET/POST | user |

### chatbot

| Endpoint | Method | Auth |
| --- | --- | --- |
| `/api/chatbot/savechatbot.php` | POST | user |
| `/api/chatbot/updatechatbot.php` | POST | user |
| `/api/chatbot/deletechatbot.php` | POST | user |
| `/api/chatbot/publishchatbot.php` | POST | user |
| `/api/chatbot/unpublishchatbot.php` | POST | user |
| `/api/chatbot/updatechatbotprice.php` | POST | user |
| `/api/chatbot/getchatbot.php` | GET/POST | optional |
| `/api/chatbot/getchatbots.php` | GET/POST | none |
| `/api/chatbot/getchatbots_v2.php` | GET/POST | optional |
| `/api/chatbot/getchatbotsmenu.php` | GET/POST | user |
| `/api/chatbot/getchatbotlimits.php` | GET/POST | user |
| `/api/chatbot/getdefaultbot.php` | GET/POST | none |
| `/api/chatbot/get_suggested.php` | GET/POST | optional |

### content

`getabout`, `getadcounts`, `getcategories`, `getcontactinfo`, `getdelivery`, `getlandingimages`,
`getowner`, `getprivacy`, `getsocials`, `gettermsofsale`, `getusage` — all `/api/content/<name>.php`,
no method guard, no auth. These back the static content popups in `web/src/widgets/info/`.

### marketplace

| Endpoint | Method | Auth |
| --- | --- | --- |
| `/api/marketplace/addtocart.php` | POST | user |
| `/api/marketplace/updatecart.php` | POST | user |
| `/api/marketplace/deletecart.php` | POST | user |
| `/api/marketplace/getcart.php` | GET/POST | user |
| `/api/marketplace/getcartcount.php` | GET/POST | user |
| `/api/marketplace/createsubscription.php` | POST | user |
| `/api/marketplace/updatesubscription.php` | POST | user |
| `/api/marketplace/deletesubscription.php` | POST | user |
| `/api/marketplace/buyproduceraccount.php` | POST | user |
| `/api/marketplace/getproducerplanstatus.php` | GET/POST | user |
| `/api/marketplace/buychatbot.php` | GET/POST | none — retired, always returns `410` |

### social

| Endpoint | Method | Auth |
| --- | --- | --- |
| `/api/social/likechatbot.php`, `dislikechatbot.php`, `followchatbot.php` | POST | user |
| `/api/social/addcomment.php`, `addreport.php`, `addhide.php`, `adduninterest.php` | POST | user |
| `/api/social/adduserlist.php`, `deleteuserlist.php`, `addbottolist.php`, `deletebotfromlist.php` | POST | user |
| `/api/social/getuserlists.php`, `getbotlists.php`, `getfollowedbots.php`, `gethide.php`, `getuninterest.php` | GET/POST | user |
| `/api/social/diduserlike.php`, `diduserdislike.php`, `diduserfollow.php`, `getuserbotstatus.php` | GET/POST | optional |
| `/api/social/getbotsoflist.php`, `getchatbotcomments.php` | GET/POST | none |

### note

| Endpoint | Method | Auth |
| --- | --- | --- |
| `/api/note/adddialogbook.php`, `addcomment2.php`, `likedialog.php`, `dislikedialog.php` | POST | user |
| `/api/note/diduserlike2.php`, `diduserdislike2.php` | GET/POST | optional |
| `/api/note/getdialogues.php`, `getdialoginteracts.php` | GET/POST | none |

### wallet

| Endpoint | Method | Auth |
| --- | --- | --- |
| `/api/wallet/withdraw.php`, `save_bank_info.php`, `upgradeplan.php` | POST | user |
| `/api/wallet/getmybalance.php`, `getiban.php`, `get_bank_info.php`, `getmypayments.php`, `getmysubscriptions.php`, `getsubscription.php` | GET/POST | user |
| `/api/wallet/getpricing.php` | GET/POST | none |

### user

| Endpoint | Method | Auth |
| --- | --- | --- |
| `/api/user/updateusernames.php`, `updateuseremail.php`, `updateuserphone.php`, `user_profilephoto.php` | POST | user |
| `/api/user/getusernames.php`, `getuseremail.php`, `getuserphone.php`, `getuserheader.php`, `user_getphoto.php` | GET/POST | user |

### message, notification, training, contact

| Endpoint | Method | Auth |
| --- | --- | --- |
| `/api/message/consumemessage.php` | POST | user |
| `/api/message/checkmessageallowance.php` | GET/POST | user |
| `/api/notification/createnotification.php`, `readnotification.php` | POST | user |
| `/api/notification/getnotification.php` | GET/POST | user |
| `/api/training/readpdf.php` (raw JSON body, `base64Data`, 15 MB cap) | POST | user |
| `/api/training/update_training_chunk.php` | POST | user |
| `/api/training/get_training_chunks.php` | GET/POST | user |
| `/api/contact/contact.php` | POST | none |

### seller

| Endpoint | Method | Auth |
| --- | --- | --- |
| `/api/seller/submerchant_register.php` | POST | user |
| `/api/seller/submerchant_resubmit.php` | GET/POST | user — delegates to `register()`, which requires auth |
| `/api/seller/submerchant_status.php` | GET | user |
| `/api/seller/submerchant_list.php` | GET | admin |
| `/api/seller/submerchant_list_remote.php` | GET/POST | admin |
| `/api/seller/submerchant_update.php` | POST | admin |
| `/api/seller/submerchant_delete.php` | POST | admin |
| `/api/seller/marketplace_refund.php` | POST | admin |
| `/api/seller/marketplace_reconcile.php` | GET/POST | shared secret — `PARAM_RECONCILE_SECRET`, compared with `hash_equals` |
| `/api/seller/parampos_callback.php` | GET/POST | none — payment-gateway callback |
| `/api/seller/list_iller.php`, `list_ilceler.php` | GET/POST | none — 15-minute file cache in the system temp dir |

> [!NOTE]
> A number of endpoints are not called from anywhere in `web/src` — among them
> `getchatbots_v2.php`, `get_suggested.php`, `getdefaultbot.php`, `createnotification.php`,
> `updatecart.php`, `updatesubscription.php`, `deletesubscription.php`, `diduserlike.php`,
> `diduserdislike.php`, `diduserfollow.php`, and every admin-only seller endpoint.

## Database
MySQL/MariaDB, accessed exclusively through the singleton `Database` class in
`api/functions/db.php`. The connection string is built as
`mysql:host=…;dbname=…;charset=utf8mb4;port=…`.

The schema (`api/database/schema.sql`, 50 tables) and the migrations
(`api/database/migrations/`) are under version control. `.gitignore` still excludes `*.sql`
generally — real dumps and backups must never be committed — with an explicit exception for
`api/database/**/*.sql`, because a schema is configuration, not data.

Every table uses `utf8mb4_general_ci`. Nine tables previously used `utf8mb4_0900_ai_ci`, which is
MySQL 8-only and does not exist in MariaDB; they have been normalised, and
`Database::ensureTable()` now writes an explicit `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci` instead of inheriting the server default (the root cause of the split).

Apply migrations with the runner, which records applied files in `schema_migrations`, refuses to
run destructive files without an explicit flag, and stops at the first failure:

```bash
php api/database/migrate.php                          # dry run (default)
php api/database/migrate.php --apply
php api/database/migrate.php --apply --allow-destructive   # needed for 002
```

Four tables are created lazily at runtime with `CREATE TABLE IF NOT EXISTS` — everything else is
assumed to exist:

| Table | Created by |
| --- | --- |
| `rate_limits` | `functions/rate_limit.php`, on every rate-limited call |
| `password_resets` | `AuthController::sendPasswordResetMail()` |
| `schema_migrations` | `database/migrate.php` |
| `param_callback_events` | `SellerController::paramposCallback()` (replay protection) |

One `ALTER TABLE` still runs conditionally at request time: `NotificationController` adds
`message_tr` / `message_en` to `notifications`. The second one — `createSubscription` adding
`chatbot_id` to `param_marketplace_details` — has been moved out of the payment transaction into
`migrations/004_add_details_chatbot_id.sql`, because DDL triggers an implicit COMMIT in MySQL and
was silently ending the transaction mid-checkout.


Table names used by the application layer are centralised in `AppConfig`:

| Constant | Table |
| --- | --- |
| `TABLE_USERS` | `kullanicilar` |
| `TABLE_CHATBOTS` | `chatbotlar` |
| `TABLE_CART` | `user_cart` |
| `TABLE_SUBSCRIPTIONS` | `user_subscriptions` |
| `TABLE_NOTIFICATIONS` | `notifications` |
| `TABLE_CONVERSATIONS` | `chatbot_conversations` |
| `TABLE_CHATS` | `chatbot_chats` |
| `TABLE_LIKES` / `TABLE_DISLIKES` / `TABLE_FOLLOWS` | `chatbot_likes` / `chatbot_dislikes` / `chatbot_follows` |
| `TABLE_COMMENTS` | `chatbot_comments` |
| `TABLE_LISTS` / `TABLE_LIST_ITEMS` | `user_lists` / `chatbot_in_list` |
| `TABLE_USER_TOKENS` | `user_tokens` |
| `TABLE_BANK_INFO` | `banka_bilgileri` |
| `TABLE_SELLERS` | `param_marketplace_sellers` |
| `TABLE_DIALOG_BOOKS` | `user_dialog_books` |
| `TABLE_COIN_BALANCES` | `user_coin_balance` |
| `TABLE_PURCHASE_CREDITS` | `chatbot_purchase_credits` |

Additional tables referenced directly in SQL: `chatbot_kategoriler`, `chatbot_hide`,
`chatbot_uninterested`, `dialog_likes`, `dialog_dislikes`, `dialog_comments`,
`param_marketplace_payments`, `param_marketplace_details`, `para_cekme_talepleri`, `global_vars`,
`themes`, `adminler`, `plans`, `plan_icerikler`, `chatbot_reports`, `chatbot_visits`.

> [!WARNING]
> The `Database` class carries explicit hardening for the legacy admin CRUD engine
> (`admin/ajax/{create,read,update,delete}.php`), which accepts client-supplied table names and raw
> `WHERE` fragments: `assertAllowedAdminTable()` enforces a fixed table whitelist,
> `assertSafeWhereFragment()` blocklists injection payloads, and `assertSafeColumnName()` validates
> column identifiers in `insert()`/`update()`. Those admin endpoints remain the riskiest surface in
> the codebase; treat the whitelist as load-bearing.

## Security

Three layers enforce the same denylist. **They must be changed together** — each covers a
deployment the others cannot see:

| Layer | File | Applies to |
| --- | --- | --- |
| Apache | `api/.htaccess`, `api/admin/.htaccess` | shared hosting / production |
| Built-in server | `api/router.php` | `php -S` (dev, `autostart.bat`, `dev:all`) |
| Next.js | `next.config.mjs` → `headers()` | everything Next serves (excludes `/api`, `/admin`, `/assets`) |

What they block: `.env`, `error_log`, `*.sql`, `db_backup/`, `composer.json`, all dotfiles, and the
`src/`, `vendor/`, `migrations/`, `database/` directories. `router.php` additionally rejects any
path containing `..` before resolving it — `urldecode()` turns `%2e%2e` back into `..`, so the
check has to happen after decoding.

`api/assets/.htaccess` and `api/admin/uploads/.htaccess` disable the script interpreter for
user-uploaded bytes.

### Response headers

`next.config.mjs` sets CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, and (production only)
HSTS. HSTS is deliberately dev-excluded: pinning `localhost` to HTTPS in a browser is hard to undo.
`api/.htaccess` sets the same three basic headers for the PHP side.

The header rule deliberately skips `/api`, `/admin` and `/assets` — the admin panel loads Tailwind
and Bootstrap Icons from two third-party CDNs, which the app's CSP would block.

### Secrets

| Secret | Lives in | Notes |
| --- | --- | --- |
| DB credentials | `api/.env` (`DB_*`) | All four required; `db.php` fails loudly if any is missing. It no longer carries hard-coded development credentials. |
| Gemini API key | `api/admin/.env` | Managed by the admin panel; read server-side only, never sent to the client. |
| Param POS | `api/.env` (`PARAM_*`) | Moved out of `web/.env`, which is read at Next.js build time and is the wrong process for them. |
| SMTP | `global_vars` table, or `SMTP_*` in `api/.env` | Environment wins when set. |
| Callback / cron secrets | `api/.env` | `PARAM_CALLBACK_SECRET`, `PARAM_RECONCILE_SECRET`. Both fail closed when unset. |

> [!WARNING]
> The database password and the Gemini API key were both reachable over HTTP before the denylist
> existed, and the database password is also in git history. **Rotate both.** Moving the files is
> not sufficient on its own.

### Authentication hardening

- Both admin login paths (`admin/ajax/giris.php` and the no-JS `admin/partials/_login.php`) go
  through one function, `admin/functions/admin_login.php`. It regenerates the session id before
  privilege escalation and applies a two-tier rate limit (5 per account, 20 per IP, 15-minute
  window). The two paths previously had independent implementations with neither.
- Google sign-in requires `email_verified` on the ID token. `verifyIdToken()` validates the
  signature, not ownership — Google signs unverified-email tokens too, and the account lookup
  matches on e-mail.
- Remember-me tokens are single-use: each successful use rotates the (selector, validator) pair
  and regenerates the session id.
- A password reset clears every remember-me token and destroys the user's other sessions.
- Password policy (10 characters, no common/contextual passwords) is enforced on **both** the
  register and the reset path; it previously existed only on register.
- Password-reset requests return an identical response whether or not the address is registered.
- The rate limiter is a single atomic `INSERT … ON DUPLICATE KEY UPDATE`, stores a SHA-256 of the
  key rather than the key itself, and sweeps expired rows.

### Mass assignment

Client JSON is never passed straight to `insert()`/`update()`. Each write endpoint declares a
column allowlist via `InputSanitizer::pickAllowed()`, which **reports** rejected keys rather than
dropping them silently. `BaseRepository` validates every column name against
`InputSanitizer::isSafeIdentifier()` as a last line of defence, and `Database` has its own
`assertSafeColumnName()`.

## Authentication

### End users

- **Sessions.** PHP sessions started in `functions/bootstrap.php` with `httponly`, `SameSite=Lax`,
  and `secure` set automatically when `$_SERVER['HTTPS']` is present. The identity is
  `$_SESSION['user_id']`.
- **Passwords.** `password_hash(..., PASSWORD_BCRYPT, ['cost' => 12])`; minimum 8 characters enforced
  in `RegisterUseCase`.
- **Login.** `LoginUseCase` accepts a username *or* email and returns the same error for an unknown
  identifier and a wrong password, so accounts cannot be enumerated. `AuthController::login` calls
  `session_regenerate_id(true)` on success.
- **Remember me.** Split selector/validator token. The validator is stored SHA-256 hashed and
  compared with `hash_equals`; the cookie is `httponly`, `secure`, `SameSite=Strict`, and lives
  `AppConfig::REMEMBER_ME_DAYS` (30) days. `AuthMiddleware::tryRememberMe()` restores the session from
  it. Logout clears the DB token as well as both cookies.
- **Google sign-in.** The browser loads Google Identity Services, and the resulting credential is
  posted to `/api/auth/login-google.php`, where `Google_Client::verifyIdToken()` validates it against
  `GOOGLE_CLIENT_ID` before `GoogleLoginUseCase` resolves or creates the account.
- **Password reset.** A 6-digit code is generated server-side, stored SHA-256 hashed in
  `password_resets`, and expires after 15 minutes (`NOW() + INTERVAL 15 MINUTE`, computed by MySQL).
  Reset requires a matching `(email, code)` pair; the user id is never taken from the client.
- **Rate limiting.** Fixed-window counters in the `rate_limits` table: login 8 per 5 min per
  IP + identifier, register 5 per 10 min per IP, password-reset request 3 per 10 min, reset-code
  verification 10 per 10 min.

### Route protection

`web/src/app/dashboard/layout.jsx` calls `/api/auth/sessioncheck.php` on mount and
`router.replace("/login")` when unauthenticated, so every `/dashboard/*` route is gated client-side.
The server-side guard is the per-endpoint `AuthMiddleware` call listed in the [API](#api) tables —
that is the authoritative one.

> [!NOTE]
> `web/src/shared/lib/auth-guard.js` documents an older design in which dashboard pages were open to
> guests and only individual actions required login. That is no longer what the code does: the
> dashboard layout redirects unauthenticated visitors. `requireLogin()` is still used for per-action
> guarding.

### Authorization

There is no role system for end users. Access is checked per resource, most notably
`ChatbotRepository::userHasAccess()`, which grants access when the caller is the bot's author, when
the bot is non-independent and its author is an active marketplace seller, or when the caller holds a
live `user_subscriptions` row for it. Ownership checks are also inlined in controllers (for example
`ChatController::updateConversation` and `TrainingController::updateTrainingChunk`).

### Admins

Admins are a separate identity in the `adminler` table. `admin/ajax/giris.php` verifies a bcrypt hash
behind a CSRF token check and sets `$_SESSION['admin']`, reusing the same PHP session as end users.
`AuthMiddleware::requireAdmin()` reads that flag; it returns `403` with `PERMISSION_DENIED` when
absent.

## Configuration

### Business constants — `api/src/Shared/Constants/AppConfig.php`

| Constant | Value | Meaning |
| --- | --- | --- |
| `DAILY_FREE_MESSAGES` | 10 | Free messages granted per user per day |
| `FREE_INDEPENDENT_BOT_LIMIT` / `FREE_PUBLIC_BOT_LIMIT` | 1 / 2 | Free-plan bot limits |
| `PRODUCER_INDEPENDENT_LIMIT` / `PRODUCER_PUBLIC_LIMIT` | 10 / 20 | Producer-plan bot limits |
| `SUBSCRIPTION_WEEKLY` / `SUBSCRIPTION_MONTHLY` | 7 / 30 days | Subscription durations |
| `DISCOUNT_MONTHLY_FACTOR` | 0.9 | Monthly price = 4 weeks × 0.9 |
| `SELLER_COMMISSION_WEEKLY` / `SELLER_COMMISSION_MONTHLY` | 0.85 / 0.80 | Seller's share of a sale |
| `MIN_WEEKLY_PRICE` / `MAX_WEEKLY_PRICE` | 1 / 5000 ₺ | `ChatbotController::assertValidPrice()` runs on publish and on price update, enforcing both bounds: `MIN_WEEKLY_PRICE` is read at four call sites (`publishChatbot` and `updatePrice`, each for the weekly and the monthly figure). The monthly ceiling is `MAX_WEEKLY_PRICE * 4`. The source comments mark both bounds as placeholder values pending confirmation. |
| `MAX_UPLOAD_SIZE_BYTES` | 5 MB | Upload cap |
| `REMEMBER_ME_DAYS` | 30 | Remember-me lifetime |

`web/src/shared/lib/pricing.js` deliberately mirrors these values for client-side validation, and
`api/functions/coin_engine.php` mirrors the bonus-credit tiers used by
`web/src/features/purchasing/BuyModal.jsx`. **Both sides must be edited together — nothing enforces
that they agree.**

### Design tokens

`web/tailwind.config.js` defines the dark "Lumanoris Elite" palette (`luma.*`), shadcn HSL variables,
gradients, shadows, and a typography scale that **overrides** Tailwind's default `text-xs` …
`text-5xl` sizes rather than extending them. Public Sans and Space Grotesk are pulled from Google
Fonts by the `@import` at the top of `global.css`; Digital-7 is a local `@font-face` served from
`web/src/font/`. `global.css` also contains `font-family` rules naming Montserrat, but nothing in the
imported stylesheet loads that family.

### Development stubs

These files ship implementations that log and return a canned value instead of doing the real work.
Each one says so in its own header comment.

| File | Stubbed behaviour |
| --- | --- |
| `api/functions/checkout_payments.php` | `chargeCard()` performs full local card validation (required fields, Luhn, CVV format, expiry) and then **simulates** a successful charge — no gateway is contacted. `reconcilePayments()`, `processRefund()`, `handleParamCallback()` and `ensureParamMarketplaceTables()` are no-ops. |
| `api/functions/ParamPosMarketplace.php` | Every sub-merchant and province/district method returns a failure or an empty list. |
| `api/functions/phpmailer.php` | `sendEmail()` writes to `error_log` and returns success. **No email is sent** — password-reset codes never reach the user. |
| `api/functions/producer_plan.php` | `buyProducerAccount()` always fails; `getProducerPlanStatus()` always reports no plan. |
| `api/functions/chatbot_limits.php` | Always returns the free-tier limits from `AppConfig`, ignoring any plan the user holds. |

## Troubleshooting

**All API calls fail with a 502 and `Backend sunucusuna ulaşılamıyor.`**
The PHP server is not running, or `PHP_TARGET` points elsewhere. `web/server.js` returns that JSON
body specifically so callers doing `JSON.parse(await res.text())` get a parseable error instead of a
syntax error.

**`Veritabanı bağlantısı başarısız`**
MySQL is unreachable, or the `DB_*` variables are unset and the hard-coded development credentials in
`functions/db.php` do not match your local server.

**Admin panel: `/admin/` loads but `/admin/seo` returns 404**
The PHP server was started without `router.php` (for example by `autostart.bat`). Restart it as
`php -S 127.0.0.1:8000 router.php` from inside `api/`.

**Chat replies never arrive; the endpoint returns `Yapay zeka servisi yapılandırılmamış.`**
`API_GOOGLE_GEMINI` is set in neither the process environment, `api/.env`, nor `api/admin/.env`.
`AppConfig::googleGeminiApiKey()` checks all three, in that order, and returns an empty string when
none of them has it.

**Password reset emails never arrive**
Expected: `functions/phpmailer.php` is a stub. The generated code is visible in the PHP error log.

**Every 500 says `Sunucu hatası oluştu.` with no detail**
By design. Set `APP_DEBUG=true` in `api/.env` for local debugging; the real message is always written
to `error_log` regardless.

**`npm run export` or `npm run phpify` fails**
Both scripts are broken — see [Available Scripts](#available-scripts). Use
`NEXT_EXPORT=1 npm run build` for a static export.

**`npm start` behaves like the dev server**
`web/package.json`'s `start` script does not set `NODE_ENV`. Run `NODE_ENV=production node server.js`.

**Turkish column and field names**
The database schema and most request payloads use Turkish identifiers (`kullanicilar`, `chatbotlar`,
`eposta`, `sifre`, `isim`, `aciklama`, `ucret_haftalik`). `AppConfig`'s `TABLE_*` constants are the
quickest map between the two vocabularies.

## Contributing

No contribution workflow, PR template, or CI configuration exists in this repository. Two
project-specific practices are documented in the code itself and should be preserved:

- **Never commit secrets.** `.gitignore` explicitly excludes `.env*` (except `*.env.example`),
  `db_backup/`, `*.sql`, and the root-level `google.txt`, `customserver.txt` and `chatbot_table.txt`
  files, with a comment recording that those files previously contained real OAuth credentials and
  server connection details. `google.txt` still holds live-looking credentials in the working tree —
  do not re-add it to version control, and rotate anything it contains.
- **Keep the mirrored constants in sync.** Pricing, commission and message-allowance values are
  duplicated between `api/src/Shared/Constants/AppConfig.php`, `api/functions/coin_engine.php` and
  `web/src/shared/lib/pricing.js`. Change all of them together.
