# Lumanoris

AI chatbot marketplace. Users create and train chatbots, chat with them, and list them for sale as
time-limited subscriptions that other users can buy.

The repository holds two applications that are always run together: a Next.js frontend (`web/`) and a
PHP backend (`api/`) that also contains a separate server-rendered admin panel.

## Overview

| Path   | Stack                                            | Responsibility                                                                           |
| ------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `web/` | Next.js 15 (App Router), React 19, Tailwind CSS 3 | Dashboard UI — chat, marketplace, cart/checkout, wallet, notes, lists, settings             |
| `api/` | PHP 8.1+, PDO/MySQL                              | JSON API (one `.php` file per endpoint), session auth, chat inference proxy, admin panel    |

`web/` is not a static frontend. `web/server.js` runs an Express process that wraps the Next.js
request handler and proxies `/api`, `/admin` and `/assets` to the PHP backend, so both applications
answer on a single origin (`http://localhost:3000` by default in development).

> [!IMPORTANT]
> Three backend subsystems are still explicitly labelled **development stubs** in their own source
> files: the Param POS marketplace client, payment charging/reconciliation/refunds, and
> producer-plan purchase. See [Development stubs](#development-stubs) before assuming any payment or
> seller-onboarding behaviour works end to end. Transactional email and plan-based chatbot limits
> were previously stubs and are now real implementations.

## Features

Each item below is backed by routes and endpoints that exist in this repository.

- **Chatbot authoring and training** — `web/src/features/chatbot-mgmt/ChatbotForm.jsx` and
  `web/src/app/dashboard/chatbots/create/page.jsx` collect a persona, style prompt, greeting,
  category and cover/profile images. Knowledge can be imported three ways: images are OCR'd in the
  browser with `tesseract.js`; PDFs are posted to `/api/training/readpdf.php` and parsed server-side
  with `smalot/pdfparser`; and a web page URL is fetched by `/api/training/readurl.php`. Extracted
  text is written to the bot's `training_prompt` in chunks via
  `/api/training/update_training_chunk.php`.
- **Chat with streaming replies** — `/api/chat/generatereply.php` proxies to the Google Gemini
  `streamGenerateContent` endpoint (`gemini-3-flash-preview`) and relays the SSE stream to the
  browser. Conversations, messages and history are stored in MySQL.
- **Message allowance ("coin") system** — a daily message quota plus per-bot bonus credits granted on
  purchase. Implemented in `api/functions/coin_engine.php`; consumption is atomic and the quota is
  read from the user's plan (see [Plans and quotas](#plans-and-quotas)).
- **Marketplace and social graph** — explore/discover pages, categories, like, dislike, follow,
  comment, report, hide, "not interested", and user-defined bot lists.
- **Cart, checkout and subscriptions** — cart endpoints plus
  `/api/marketplace/createsubscription.php`, which runs inside a DB transaction guarded by an
  idempotency key: it validates/charges the card, creates `user_subscriptions` rows, grants purchase
  credits, clears the cart, and writes payment rows. Any failure rolls the whole thing back.
- **Wallet and seller onboarding** — balance, payment history, subscriptions, IBAN/bank details,
  withdrawal requests, and a Param POS sub-merchant registration wizard.
- **Notes / dialogue books** — saving and sharing conversation excerpts, with likes and comments.
- **Admin panel** — a separate server-rendered PHP UI at `/admin` for users, chatbots, categories,
  SEO, SMTP, API keys, withdrawals, and content pages.

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

`eslint` 9 + `eslint-config-next` (flat config in `web/eslint.config.mjs`, extending
`next/core-web-vitals`), `nodemon` (watches `server.js` only), `concurrently` (used by the `dev:all`
script).

### Backend

| Component | Detail |
| --- | --- |
| PHP | `>=8.1` required by `api/composer.json` |
| Database | MySQL/MariaDB via PDO (`utf8mb4`, `ERRMODE_EXCEPTION`, emulated prepares off) |
| `google/apiclient` ^2.16 | Verifying Google ID tokens in `AuthController::loginGoogle` |
| `smalot/pdfparser` ^2.9 | Server-side PDF text extraction |
| `vlucas/phpdotenv` ^5.6 (separate `api/admin/composer.json`) | Reads `api/admin/.env` for the admin API-keys page |
| Google Gemini REST API | Chat inference, called with cURL from `ChatController::generateReply` |

SMTP is spoken directly by `api/functions/smtp_client.php`, a dependency-free client — no mail
library is installed.

There is no Docker, CI, or automated test tooling of any kind in this repository.

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

All three prefixes are in use. `/assets/*` serves user-uploaded images: `ChatbotController` writes
cover/profile uploads into `api/assets/<column>/`, and the resulting `assets/…` relative path is what
is stored in the database and rendered by the frontend.

### Backend layering

Every file under `api/api/` is a three-line entrypoint: require `src/autoload.php`, then call one
static controller method. `api/src/autoload.php` boots `functions/bootstrap.php` (JSON header,
session, `.env` parsing, PDO connection, response helpers, and global exception / error / fatal
handlers), `validators.php` and `rate_limit.php`, then registers a filename-based autoloader that
searches a fixed list of directories.

```
Presentation/Controllers  →  Application/UseCases  →  Infrastructure/Repositories  →  Database (PDO)
                          ↘  Presentation/Response/JsonResponse
                          ↘  Presentation/Middleware/AuthMiddleware
```

> [!WARNING]
> The layering is only partially applied. Use cases exist for auth only
> (`Application/UseCases/Auth/` — `LoginUseCase`, `RegisterUseCase`, `GoogleLoginUseCase`); every
> other controller talks to `Database` or a repository directly. `Domain/Interfaces/` declares eight
> repository interfaces (cart, chat, chatbot, notification, social, subscription, user, wallet), but
> only two implementations exist — `ChatbotRepository` and `UserRepository`, both extending
> `BaseRepository`. The other six interfaces have no implementation. Several directories in the
> autoloader's search list (`Domain/Entities/`, `Infrastructure/Mail/`, `Infrastructure/Payment/`,
> `Application/DTO/`, and others) exist but are empty.

`AppException.php` defines eight exception classes in one file, so `autoload.php` requires it
unconditionally — the filename-based autoloader could only ever resolve one of them.

## Folder Structure

```
lumanoris-dashboard/
├── package.json              # root shim — every script delegates to web/
├── autostart.bat             # Windows helper: opens two terminals (PHP + Next.js)
├── TODO.md                   # stale scratch notes for a ChatbotForm refactor
├── project_tree.txt          # generated snapshot of the tree, not consumed by any code
├── storage/                  # runtime artefacts, OUTSIDE the document root, contents gitignored
│   ├── db_backup/            #   mysqldump output (default DB_BACKUP_DIR)
│   ├── logs/                 #   php-error.log (default APP_LOG_FILE) + legacy logs
│   └── archive/              #   ad-hoc source archives
│
├── web/
│   ├── server.js             # Express + Next.js + PHP proxy (PORT/HOST env, /healthz, graceful shutdown)
│   ├── next.config.mjs       # static-export toggle, distDir override, rewrites, security headers
│   ├── tailwind.config.js    # "Lumanoris Elite" dark palette + typography scale
│   ├── components.json       # shadcn/ui generator config (style: new-york, tsx: false)
│   ├── scripts/phpify.js     # copies web/src/php → web/out (source dir does not exist — see Scripts)
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
    ├── .htaccess             # document-root denylist (.env, dumps, logs, src/, vendor/, functions/)
    ├── router.php            # dev-server router: same denylist + admin pretty URLs
    ├── composer.json         # google/apiclient, smalot/pdfparser
    ├── .env.example          # documents every backend variable
    ├── api/<domain>/*.php    # endpoint entrypoints (3 lines each) + index.php 404 fallback
    ├── assets/               # user-uploaded images (.htaccess disables script execution)
    ├── database/
    │   ├── schema.sql        #   50 tables, utf8mb4_general_ci throughout
    │   ├── migrations/       #   001–009 (incl. 002b), applied in filename order
    │   ├── migrate.php       #   runner: dry-run by default, records schema_migrations
    │   └── seed_contracts.*  #   seeds legal contract texts into global_vars
    ├── functions/            # bootstrap, env, logging, db, rate limit, mailer, SMTP, coin engine, plans, stubs
    ├── src/                  # Presentation / Application / Domain / Infrastructure / Shared
    └── admin/                # server-rendered admin panel (own composer.json + .env + .htaccess)
```

Notes on files a newcomer will trip over:

- `web/public/api/get_bank_info.php` and `save_bank_info.php` `require '../../php/functions/db.php'`,
  a path that does not exist in this repository. They are also unreachable at runtime, because the
  proxy sends every `/api/*` request to the PHP backend before Next.js sees it.
- `web/src/app/css/global.css` (808 lines) is the file imported by `app/layout.js`.
  `global.scss` (11,004 lines) and `global.css.map` are leftovers — no Sass compiler is configured in
  `web/package.json` and no JavaScript imports the `.scss`.
- `web/src/app/auth/page.jsx` and `web/src/app/dashboard/market/page.jsx` deliberately call
  `notFound()` — they are retired routes kept as explicit 404s.
- `api/_restoretest.php` is a scratch script; both `api/.htaccess` and `router.php` deny it by name.
- `web/src/.next-verify/` is build output from a `NEXT_DIST_DIR` verification build, not source.

## Installation

### Prerequisites

| Requirement | Verified from |
| --- | --- |
| PHP 8.1+ with `pdo_mysql` and `curl` | `api/composer.json`; PDO/cURL usage in `functions/db.php`, `ChatController`, `TrainingController` |
| Composer | `api/composer.lock`, `api/admin/composer.lock` |
| MySQL or MariaDB | `Database` builds a `mysql:` DSN |
| Node.js + npm | `web/package-lock.json` (lockfileVersion 3) |

npm is the package manager: `web/package-lock.json` is the only lockfile present, and there is no
`packageManager` field. No Node or PHP runtime version is pinned anywhere (no `engines` field, no
`.nvmrc`, no `platform` block in `composer.json`).

### 1. Backend

```bash
cd api
composer install
cp .env.example .env
```

Then fill in `api/.env`. `api/.env.example` documents every variable the backend reads, including
which ones are mandatory.

The admin panel has its own dependency tree and its own env file:

```bash
cd api/admin
composer install
```

`API_GOOGLE_GEMINI` (the Gemini key used for chat inference) belongs in `api/admin/.env` — that is
the file the admin panel's API-integrations page writes, and `AppConfig::googleGeminiApiKey()`
parses it directly as a fallback. It first checks `$_ENV` / `getenv()`, so setting the variable in
`api/.env` also works, because `functions/bootstrap.php` loads that file into both.

### 2. Database

The schema and migrations are in version control (`api/database/`). A fresh install is:

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
> `002_clean_orphan_rows.sql` and `002b_clean_orphan_rows_2.sql` **delete and rewrite data** — they
> remove rows orphaned by the years the schema ran without foreign keys, so that
> `003_add_foreign_keys.sql` can succeed. Read them before running them. The runner refuses to
> execute a data-destroying migration unless you also pass `--allow-destructive`.

The runner records what it applied in `schema_migrations` (with a checksum), so re-running it is
safe, and it stops at the first failure rather than continuing out of order. `--status` prints what
has and has not been applied without changing anything.

Optionally seed the legal contract texts that the admin pages and frontend popups read:

```bash
php api/database/seed_contracts.php            # dry run
php api/database/seed_contracts.php --apply    # fills only empty global_vars keys
```

Credentials come from `api/.env` (`DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`). **All four are
required.** `db.php` carries no hard-coded fallback credentials and throws a descriptive exception
rather than connecting somewhere unintended. An empty `DB_PASS=` is a valid value (password-less
user); an empty host, user or database name is rejected.

### 3. Frontend

```bash
cd web
npm install
```

`web/.env` is required for Google sign-in (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`). There is no
`web/.env.example`.

## Environment Variables

### `api/.env` — loaded by `functions/env.php`, into both `$_ENV` and `putenv()`

Values already present in the real process environment always win over the file, so container env
vars are never overwritten by a stale `.env`.

| Variable | Required | Read by | Purpose |
| --- | --- | --- | --- |
| `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` | **Yes** | `functions/db.php` | Connection settings. `DB_HOST` accepts `host:port` (default port 3306). |
| `APP_DEBUG` | No | `functions/bootstrap.php`, `admin/index.php` | When `true`, error responses carry the real exception message and the admin panel enables `display_errors`. Leave false outside local dev. |
| `GOOGLE_CLIENT_ID` | For Google login | `AppConfig::googleClientId()` | Audience for verifying Google ID tokens on `/api/auth/login-google.php`. |
| `CONTACT_EMAIL` | No | `AppConfig::contactEmail()` | Recipient for contact-form mail. Falls back to a hard-coded address. |
| `NOREPLY_EMAIL` | No | `AppConfig::noreplyEmail()` | Sender for password-reset mail. Falls back to a hard-coded address. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_NAME`, `SMTP_ENCRYPTION` | No | `functions/phpmailer.php` | SMTP transport. When unset, the equivalent `global_vars` rows written by the admin panel's SMTP page are used instead. |
| `PARAM_CALLBACK_SECRET` | For callbacks | `SellerController::paramposCallback()` | Shared secret for the payment-gateway callback. Fails closed: without it no notification is accepted. |
| `PARAM_RECONCILE_SECRET` | For reconcile | `SellerController::reconcile()` | Shared secret required via `?secret=`, POST `secret`, or `X-Reconcile-Secret`. If unset, the endpoint always rejects. |
| `DB_BACKUP_DIR` | No | `Database::backupDir()` | Where `mysqldump` output is written. Defaults to `storage/db_backup`. A path resolving inside `api/` is refused. |
| `APP_LOG_FILE` | No | `functions/logging.php` | PHP error-log destination. Defaults to `storage/logs/php-error.log`. |
| `MYSQL_BIN_DIR` | No | `functions/db.php` | Directory holding the `mysql` / `mysqldump` binaries. Needed when they are not on `PATH`. |

> [!NOTE]
> `api/.env.example` also defines `PARAM_CLIENT_CODE`, `PARAM_CLIENT_USERNAME`,
> `PARAM_CLIENT_PASSWORD`, `PARAM_GUID`, `PARAM_MARKETPLACE_GUID`, `PARAM_PAYMENT_WSDL`,
> `PARAM_MARKETPLACE_WSDL`, `PARAM_PAYMENT_SECURITY_TYPE`, `PARAM_REF_URL`, `PARAM_SUCCESS_URL` and
> `PARAM_FAIL_URL`. A search of the whole repository finds **no code that reads any of them** —
> consistent with `ParamPosMarketplace.php` being a stub. They belong to the production Param POS
> implementation, which is not in this repository.

### `api/admin/.env` — loaded by `vlucas/phpdotenv` in `admin/api.php`

| Variable | Purpose |
| --- | --- |
| `API_GOOGLE_GEMINI` | Google Gemini API key used for chat inference. Server-side only; never sent to the browser. |

### `web/.env` and the Node process environment

| Variable | Read by | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `web/src/app/login/page.jsx` | Client ID passed to `google.accounts.id.initialize`. Without it the Google button shows an error toast. |
| `PHP_TARGET` | `web/server.js`, `web/next.config.mjs` | Backend origin for the proxy/rewrites. `server.js` defaults to `http://127.0.0.1:8000`; `next.config.mjs` emits no rewrites when it is unset. |
| `PORT` | `web/server.js` | Listen port. Defaults to `3000`. |
| `HOST` | `web/server.js` | Bind address. Defaults to `127.0.0.1` in development and `0.0.0.0` in production. |
| `NODE_ENV` | `web/server.js` | Anything other than `production` starts Next.js in dev mode. |
| `NEXT_EXPORT` | `web/next.config.mjs` | When `1`, switches the build to `output: 'export'` with unoptimized images, and disables rewrites and `headers()`. |
| `NEXT_DIST_DIR` | `web/next.config.mjs` | Overrides Next's output directory (default `.next`). Use it to run a verification build without clobbering a running dev server's output. |

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
| `build` | `next build` | Verified by execution — succeeds, producing 24 statically prerendered routes. |
| `start` | `node server.js` | Does **not** set `NODE_ENV`; without `NODE_ENV=production` it starts Next.js in dev mode and binds `127.0.0.1`. |
| `lint` | `next lint` | Verified by execution — passes with no warnings. Prints a deprecation notice: `next lint` is removed in Next.js 16. |
| `export` | `next export` | **Broken.** Verified by execution: Next.js 15 removed this command in favour of `output: 'export'`. Use `NEXT_EXPORT=1 npm run build` instead. |
| `phpify` | `node scripts/phpify.js` | **Broken.** Verified by execution: it copies `web/src/php` to `web/out`; `web/src/php` does not exist, so the script fails with `ENOENT` and creates nothing. |

### Destructive operations

> [!CAUTION]
> `api/admin/ajax/db_backup.php` with `mode=restore` calls `Database::restore()`, which pipes a
> backup file into `mysql`, overwriting the live database. `mode=backup` shells out to `mysqldump`.
>
> Both require **POST + a valid CSRF token + an authenticated admin session** (enforced by
> `admin/ajax/_guard.php`), and `restore` additionally requires an explicit `confirm=RESTORE` field.
> Only `mode=list` is reachable by `GET`.
>
> Backups are written **outside the document root** — the repo-root `storage/db_backup/` by default,
> overridable with `DB_BACKUP_DIR`. `Database::backupDir()` refuses any configured path that resolves
> inside `api/`.
>
> `Database::truncate()` also exists but is not called anywhere in the repository.

`php api/database/migrate.php --apply --allow-destructive` is the other destructive command — see
[Database](#database).

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
no `.htaccess` support in `php -S`): `.env` files, `error_log`, `db_backup/`, archive and dump
extensions, `composer.json`/`composer.lock`, dotfiles, and the `src/`, `vendor/`, `migrations/`,
`database/` and `functions/` directories all return 404. Requests containing `..` are rejected
before any path resolution — `urldecode()` turns `%2e%2e` back into `..`, so the check happens after
decoding. The Apache equivalents live in `api/.htaccess` and `api/admin/.htaccess` — **change all
three together.**

**Terminal 2 — frontend, from `web/`:**

```bash
cd web
npm run dev
```

Or start both at once with `npm run dev:all` from `web/`.

Open <http://localhost:3000>. `/` redirects to `/dashboard`; `/register` redirects to
`/login?tab=register`. `GET /healthz` on the Node server returns uptime and `NODE_ENV` without
touching PHP.

`autostart.bat` at the repository root opens both terminals on Windows, starting the backend as
`php -S 127.0.0.1:8000 router.php` from inside `api/`.

> [!NOTE]
> Both sides deliberately bind `127.0.0.1` rather than `localhost`. On Windows `localhost` resolves
> to `::1` first, which left PHP listening on IPv6 only while Node bound IPv4 — every proxied call
> then failed with `ECONNREFUSED`.

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
npm run build
NODE_ENV=production node server.js
```

Static-export mode is also supported:

```bash
cd web
NEXT_EXPORT=1 npm run build
```

This sets `output: 'export'` and `images.unoptimized`, and disables both the rewrites and the
`headers()` block — the exported output must then be served behind something that routes `/api`,
`/admin` and `/assets` to PHP and sets the security headers itself.

`app/layout.js` sets `export const dynamic = 'force-static'`, so all 24 routes prerender as static
content and every data fetch happens client-side.

To run a build purely to check that it compiles, without overwriting a running dev server's `.next`:

```bash
NEXT_DIST_DIR=.next-verify npm run build
```

## Deployment

Only what the repository itself shows is documented here.

- `web/server.js` reads `PORT` (default `3000`) and `HOST` (default `127.0.0.1` in dev,
  `0.0.0.0` in production), exposes `GET /healthz`, and handles `SIGTERM`/`SIGINT` with a graceful
  shutdown that waits up to 15 seconds for in-flight requests before forcing exit.
- `npm start` does not set `NODE_ENV=production`. Run `NODE_ENV=production node server.js`, or set
  the variable in the process manager.
- `next.config.mjs` comments state the `rewrites()` block exists specifically because Vercel does not
  run a custom server. `PHP_TARGET` must point at the real backend origin in that setup.
- `api/admin/.htaccess` and `api/.htaccess` imply Apache with `mod_rewrite`, `mod_headers` and
  `mod_authz_core` for the PHP side in production.

The actual hosting platform, process manager, TLS termination, and PHP deployment method could not
be verified from the repository.

## API

### Conventions

- Endpoints are physical files. The URL is the file path: `/api/<domain>/<file>.php`.
- Most `POST` endpoints expect `multipart/form-data` with a single field named `data` containing a
  JSON string. `web/src/shared/api/client.js` builds exactly that shape; most pages build it inline
  with `FormData`. Some endpoints differ: `/api/training/readpdf.php` and `/api/training/readurl.php`
  read a raw JSON body, and `/api/auth/passresetmail.php` and `/api/auth/updateuserpass.php` read
  plain `$_POST` fields.
- Success responses are `{"success": true, ...payload}`; errors are
  `{"success": false, "message": "...", "error_code": "..."}` (`JsonResponse`). Error codes come from
  `AppConfig::ERR_*`: `VALIDATION_ERROR`, `AUTH_REQUIRED`, `NOT_FOUND`, `PERMISSION_DENIED`,
  `LIMIT_REACHED`, `SELLER_NOT_ACTIVE`, `DUPLICATE_ENTRY`, `PAYMENT_ERROR`, `FEATURE_UNAVAILABLE`,
  `SERVER_ERROR`.
- Two handlers return a shape that is **not** the standard envelope:
  `ChatController::getConversation` returns a bare row object with no `success` key, and
  `AuthController::sessionCheck` returns `{"authenticated": false}` when signed out (its signed-in
  branch does use the envelope). A few others — `UserController::getProfilePhoto` and the two
  `seller/list_*` endpoints — `echo` their JSON directly instead of going through `JsonResponse`,
  but still emit the `success` key.
- Status codes observed: `401` with `AUTH_REQUIRED` for a protected endpoint without a session,
  `405 {"success":false,"message":"Method not allowed"}` for a wrong verb, `429` from the rate
  limiter, `500` from the global exception/fatal handlers, `503` with `FEATURE_UNAVAILABLE` from the
  fail-closed payment stubs, and `404` for any unmatched `/api/**` path (`api/api/index.php`).
- `/api/chat/generatereply.php` is the one non-JSON endpoint: it sets
  `Content-Type: text/event-stream` and streams Gemini's SSE response through.

The **Auth** column is derived from the guard each controller method calls: `user` =
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
no method guard, no auth. All use the standard `{"success": true, ...}` envelope. These back the
static content popups in `web/src/widgets/info/`.

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
| `/api/note/getdialogues.php`, `getdialoginteracts.php` | GET/POST | user |

### wallet

| Endpoint | Method | Auth |
| --- | --- | --- |
| `/api/wallet/withdraw.php`, `save_bank_info.php`, `upgradeplan.php` | POST | user |
| `/api/wallet/getmybalance.php`, `getiban.php`, `get_bank_info.php`, `getmypayments.php`, `getmysubscriptions.php`, `getsubscription.php` | GET/POST | user |
| `/api/wallet/getpricing.php` | GET/POST | optional |
| `/api/wallet/list_withdrawals.php` | GET/POST | admin |
| `/api/wallet/update_withdrawal_status.php` | POST | admin |

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
| `/api/training/readpdf.php` (raw JSON body, `base64Data`) | POST | user |
| `/api/training/readurl.php` (raw JSON body, `url`; 3 MB cap) | POST | user |
| `/api/training/update_training_chunk.php` | POST | user |
| `/api/training/get_training_chunks.php` | GET/POST | user |
| `/api/contact/contact.php` | POST | none |

> [!NOTE]
> `/api/training/readurl.php` fetches an arbitrary user-supplied URL and is SSRF-hardened: only
> `http`/`https`, every DNS-resolved IP is checked against private/loopback/link-local ranges,
> redirects are disabled, the protocol list is restricted, and size/time caps plus a per-user rate
> limit apply.

### seller

| Endpoint | Method | Auth |
| --- | --- | --- |
| `/api/seller/submerchant_register.php` | POST | user |
| `/api/seller/submerchant_resubmit.php` | GET/POST | user — delegates to `register()`, which requires POST + auth |
| `/api/seller/submerchant_status.php` | GET | user |
| `/api/seller/submerchant_list.php` | GET | admin |
| `/api/seller/submerchant_list_remote.php` | GET/POST | admin |
| `/api/seller/submerchant_update.php` | POST | admin |
| `/api/seller/submerchant_delete.php` | POST | admin |
| `/api/seller/marketplace_refund.php` | POST | admin |
| `/api/seller/marketplace_reconcile.php` | GET/POST | shared secret — `PARAM_RECONCILE_SECRET`, compared with `hash_equals` |
| `/api/seller/parampos_callback.php` | POST | none — payment-gateway callback, gated by `PARAM_CALLBACK_SECRET` |
| `/api/seller/list_iller.php`, `list_ilceler.php` | GET/POST | none — province/district lookups, cached 15 min as JSON in the system temp dir; `?nocache` bypasses it |

### Endpoints with no caller in `web/src`

Verified by diffing every `/api/**.php` literal in `web/src` against the files under `api/api/`:

`chatbot/get_suggested.php`, `chatbot/getchatbots_v2.php`, `chatbot/getdefaultbot.php`,
`content/getcontactinfo.php`, `content/getlandingimages.php`, `content/getowner.php`,
`content/getsocials.php`, `marketplace/buychatbot.php`, `marketplace/updatecart.php`,
`marketplace/updatesubscription.php`, `marketplace/deletesubscription.php`,
`message/consumemessage.php`, `notification/createnotification.php`, `social/diduserlike.php`,
`social/diduserdislike.php`, `social/diduserfollow.php`, `wallet/list_withdrawals.php`,
`wallet/update_withdrawal_status.php`, and every admin-only `seller/*` endpoint.

`consumemessage.php` is unused because message consumption moved server-side into
`generatereply.php`; the admin-only endpoints are driven from the PHP admin panel, not the Next.js
app.

### Rate limits

Fixed-window counters in the `rate_limits` table, applied via `checkRateLimit()` (429 on breach):

| Key | Limit |
| --- | --- |
| `login:<ip>:<identifier>` | 8 per 5 min |
| `login-ip:<ip>` | 30 per 5 min |
| `register:<ip>` | 5 per 10 min |
| `passreset:<ip>:<email>` | 3 per 10 min |
| `resetcode:<ip>:<email>` | 10 per 10 min |
| `contact:<ip>` | 5 per 10 min |
| `savechatbot:<user>` | 20 per 5 min |
| `genreply:<user>` | 20 per min |
| `consumemsg:<user>` | 60 per min |
| `checkout:<user>` | 5 per min |
| `readurl:<user>` | 15 per 5 min |
| `readpdf:<user>` | 10 per 5 min |
| `parampos_cb:<ip>` | 60 per min |

The admin login path uses the non-throwing `rateLimitHit()` variant instead: 5 per account and 20 per
IP, in a 15-minute window.

## Database

MySQL/MariaDB, accessed exclusively through the singleton `Database` class in `api/functions/db.php`.
The connection string is built as `mysql:host=…;dbname=…;charset=utf8mb4;port=…`.

The schema (`api/database/schema.sql`, 50 tables) and the migrations (`api/database/migrations/`,
files `001`–`009` including `002b`) are under version control. `.gitignore` excludes `*.sql`
generally — real dumps and backups must never be committed — with an explicit exception for
`api/database/**/*.sql`, because a schema is configuration, not data.

Every table in `schema.sql` uses `utf8mb4_general_ci`, and `Database::ensureTable()` writes an
explicit `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci` rather than inheriting
the server default. Migration `005_fix_table_collations.sql` exists to normalise databases created
before that was true.

Apply migrations with the runner, which records applied files and their checksums in
`schema_migrations`, refuses to run destructive files without an explicit flag, and stops at the
first failure:

```bash
php api/database/migrate.php                              # dry run (default)
php api/database/migrate.php --status                     # what is applied / pending
php api/database/migrate.php --apply
php api/database/migrate.php --apply --allow-destructive  # needed for 002 and 002b
```

Five tables are created lazily at runtime with `CREATE TABLE IF NOT EXISTS` — everything else is
assumed to exist:

| Table | Created by |
| --- | --- |
| `rate_limits` | `functions/rate_limit.php` |
| `password_resets` | `AuthController::sendPasswordResetMail()` |
| `checkout_idempotency` | `MarketplaceController::createSubscription()` |
| `param_callback_events` | `SellerController::paramposCallback()` (replay protection) |
| `schema_migrations` | `database/migrate.php` |

One conditional `ALTER TABLE` still runs at request time: `NotificationController` adds `message_tr`
and `message_en` to `notifications`. The equivalent inside `createSubscription` was moved out to
`migrations/004_add_details_chatbot_id.sql`, because DDL triggers an implicit COMMIT in MySQL and was
silently ending the payment transaction mid-checkout.

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
`themes`, `adminler`, `plans`, `plan_icerikler`, `producer_plans`, `user_plan_selection`,
`chatbot_reports`, `chatbot_visits`.

> [!WARNING]
> The `Database` class carries explicit hardening for the legacy admin CRUD engine
> (`admin/ajax/{create,read,update,delete}.php`), which accepts client-supplied table names and raw
> `WHERE` fragments: `assertAllowedAdminTable()` enforces a fixed table whitelist,
> `assertSafeWhereFragment()` blocklists injection payloads, and `assertSafeColumnName()` validates
> column identifiers in `insert()`/`update()`. Those admin endpoints remain the riskiest surface in
> the codebase; treat the whitelist as load-bearing.

## Authentication

### End users

- **Sessions.** PHP sessions started in `functions/bootstrap.php` with `httponly`, `SameSite=Lax`,
  and `secure` set automatically when `$_SERVER['HTTPS']` is present. The identity is
  `$_SESSION['user_id']`.
- **Passwords.** `password_hash(..., PASSWORD_BCRYPT, ['cost' => 12])`. The policy lives in
  `InputSanitizer::passwordPolicyError()` and is applied on **both** the register and the
  password-reset path: minimum 10 characters, maximum 200, not whitespace-only, not a single repeated
  character, not one of a common-password list, and it may not contain the username or the local part
  of the e-mail address.
- **Login.** `LoginUseCase` accepts a username *or* email and returns the same error for an unknown
  identifier and a wrong password, so accounts cannot be enumerated. `AuthController::login` calls
  `session_regenerate_id(true)` on success.
- **Remember me.** Split selector/validator token. The validator is stored SHA-256 hashed and
  compared with `hash_equals`; the cookie is `httponly`, `secure`, `SameSite=Strict`, and lives
  `AppConfig::REMEMBER_ME_DAYS` (30) days. `AuthMiddleware::tryRememberMe()` restores the session from
  it, rotating the pair and regenerating the session id on every use. A valid selector with a bad
  validator burns that selector. Logout clears the DB token as well as both cookies.
- **Google sign-in.** The browser loads Google Identity Services, and the resulting credential is
  posted to `/api/auth/login-google.php`, where `Google_Client::verifyIdToken()` validates it against
  `GOOGLE_CLIENT_ID` before `GoogleLoginUseCase` resolves or creates the account. The handler
  additionally requires `email_verified` on the payload — `verifyIdToken()` validates the signature,
  not ownership, and Google signs unverified-email tokens too, while the account lookup matches on
  e-mail.
- **Password reset.** A 6-digit code is generated server-side, stored SHA-256 hashed in
  `password_resets`, and expires after 15 minutes (computed by MySQL). Reset requires a matching
  `(email, code)` pair; the user id is never taken from the client. A successful reset clears every
  remember-me token and destroys the user's other sessions. Reset requests return an identical
  response whether or not the address is registered.

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

Admins are a separate identity in the `adminler` table, reusing the same PHP session as end users.
Both admin login paths (`admin/ajax/giris.php` and the no-JS `admin/partials/_login.php`) go through
one function, `admin/functions/admin_login.php`, which verifies a bcrypt hash, regenerates the
session id before privilege escalation, and applies the two-tier rate limit described above. Every
admin AJAX endpoint includes `admin/ajax/_guard.php`, which rejects non-admins with `403` and
requires a CSRF token (`csrf_token` field or `X-CSRF-Token` header) on every non-`GET` request.
`AuthMiddleware::requireAdmin()` reads the same `$_SESSION['admin']` flag for the JSON API and
returns `403` with `PERMISSION_DENIED` when absent.

## Security

Three layers enforce the same denylist. **They must be changed together** — each covers a
deployment the others cannot see:

| Layer | File | Applies to |
| --- | --- | --- |
| Apache | `api/.htaccess`, `api/admin/.htaccess` | shared hosting / production |
| Built-in server | `api/router.php` | `php -S` (dev, `autostart.bat`, `dev:all`) |
| Next.js | `next.config.mjs` → `headers()` | everything Next serves (excludes `/api`, `/admin`, `/assets`) |

What they block: `.env` files, `error_log`, dumps and archives (`.sql`, `.zip`, `.tar`, `.gz`,
`.bak`, `.key`, `.pem`, …), `db_backup/`, `composer.json`/`composer.lock`, all dotfiles, and the
`src/`, `vendor/`, `migrations/`, `database/` and `functions/` directories. Directory indexes are
disabled.

`api/assets/.htaccess` and `api/admin/uploads/.htaccess` disable the script interpreter for
user-uploaded bytes (`php_flag engine off`, handler removal, and an extension denylist).

### Response headers

`next.config.mjs` sets CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`,
`Cross-Origin-Opener-Policy: same-origin-allow-popups`, and (production only) HSTS and
`upgrade-insecure-requests`. Both production-only directives are deliberately dev-excluded: pinning
`localhost` to HTTPS in a browser is hard to undo, and upgrading sub-requests breaks plain-HTTP local
access from a LAN IP. `api/.htaccess` sets the three basic headers for the PHP side.

The header rule deliberately skips `/api`, `/admin` and `/assets` — the admin panel loads assets from
third-party CDNs that the app's CSP would block. The CSP allows `accounts.google.com` for
script/style/connect/frame because Google Identity Services renders its button in an iframe from that
origin.

### Secrets

| Secret | Lives in | Notes |
| --- | --- | --- |
| DB credentials | `api/.env` (`DB_*`) | All four required; `db.php` fails loudly if any is missing, and carries no fallback credentials. |
| Gemini API key | `api/admin/.env` | Managed by the admin panel; read server-side only, never sent to the client. |
| Param POS credentials | `api/.env` (`PARAM_*`) | Present in `.env.example` but read by no code in this repository. |
| SMTP | `global_vars` table, or `SMTP_*` in `api/.env` | Environment wins when set. |
| Callback / reconcile secrets | `api/.env` | `PARAM_CALLBACK_SECRET`, `PARAM_RECONCILE_SECRET`. Both fail closed when unset. |

> [!CAUTION]
> The repository root contains `google.txt`, `customserver.txt` and `chatbot_table.txt`, which hold
> credential-shaped content. `.gitignore` excludes all three by explicit path with a comment
> recording that they previously contained real OAuth credentials and server connection details.
> `api/` also contains several `.env.bak-*` files. Treat every value in these files as compromised
> and rotate it; removing a file does not remove it from git history.

### Mass assignment

Client JSON is never passed straight to `insert()`/`update()`. Each write endpoint declares a
column allowlist via `InputSanitizer::pickAllowed()`, which **reports** rejected keys rather than
dropping them silently. `BaseRepository` validates every column name against
`InputSanitizer::isSafeIdentifier()` as a last line of defence, and `Database` has its own
`assertSafeColumnName()`.

## Configuration

### Business constants — `api/src/Shared/Constants/AppConfig.php`

| Constant | Value | Meaning |
| --- | --- | --- |
| `DAILY_FREE_MESSAGES` | 10 | Fallback daily message quota. Used only when the `plans` table is unavailable — see [Plans and quotas](#plans-and-quotas). |
| `FREE_INDEPENDENT_BOT_LIMIT` / `FREE_PUBLIC_BOT_LIMIT` | 1 / 2 | Fallback free-plan bot limits, same condition. |
| `SUBSCRIPTION_WEEKLY` / `SUBSCRIPTION_MONTHLY` | 7 / 30 days | Subscription durations |
| `DISCOUNT_MONTHLY_FACTOR` | 0.9 | Applied exactly once, when a seller sets a price: `ucret_aylik = round(weekly × 4 × 0.9)`. Everything downstream uses the stored value as-is. |
| `SELLER_COMMISSION_WEEKLY` / `SELLER_COMMISSION_MONTHLY` | 0.85 / 0.80 | Seller's share of a sale |
| `MIN_WEEKLY_PRICE` / `MAX_WEEKLY_PRICE` | 1 / 5000 ₺ | Enforced by `ChatbotController::assertValidPrice()` on publish and on price update, for both the weekly and the derived monthly figure. The source marks both as placeholder values pending product/finance confirmation. |
| `MAX_UPLOAD_SIZE_BYTES` | 5 MB | Upload cap, enforced in `ChatbotController::handleImageUploads()` |
| `REMEMBER_ME_DAYS` | 30 | Remember-me lifetime |

> [!NOTE]
> `PRODUCER_INDEPENDENT_LIMIT`, `PRODUCER_PUBLIC_LIMIT`, `SERVICE_FEE_PERCENT`,
> `SERVICE_FEE_EXEMPT_ABOVE` and `DEFAULT_PAGE_LIMIT` are declared but read by no code. In
> particular **no service fee is charged anywhere** — do not assume one is applied because the
> constants exist. The producer limits are superseded by the `plans` table.

`web/src/shared/lib/pricing.js` deliberately mirrors the pricing values for client-side validation,
and `api/functions/coin_engine.php` mirrors the bonus-credit tiers used by
`web/src/features/purchasing/BuyModal.jsx`. **Both sides must be edited together — nothing enforces
that they agree.**

### Plans and quotas

`api/functions/plans.php` is the single source of truth for per-plan quotas. `getUserPlan()` joins
`user_plan_selection.plan_name` to `plans.name_tr`, falling back to the default plan row, and both
`chatbot_limits.php` (bot limits) and `coin_engine.php` (daily message quota) read through it. When
the `plans` table is missing, has no quota columns (migration `007_plan_limits.sql` not applied), or
is empty, `fallbackPlan()` returns the `AppConfig` values above — so behaviour is unchanged on an
un-migrated database.

### Design tokens

`web/tailwind.config.js` defines the dark "Lumanoris Elite" palette (`luma.*`), shadcn HSL variables,
gradients, shadows, and a typography scale that **overrides** Tailwind's default `text-xs` …
`text-5xl` sizes rather than extending them. `darkMode` is set to `["class"]`. Public Sans and Space
Grotesk are pulled from Google Fonts by the `@import` on line 6 of `global.css`; Digital-7 is a local
`@font-face` served from `web/src/font/`. `global.css` also contains `font-family` rules naming
Montserrat, but nothing in the imported stylesheet loads that family.

### Development stubs

These files ship implementations that log and return a canned value instead of doing the real work.
Each one says so in its own header comment.

| File | Stubbed behaviour |
| --- | --- |
| `api/functions/ParamPosMarketplace.php` | Every sub-merchant and province/district method returns a failure or an empty list. This is fail-closed by design, but the practical consequence is that on a clean install **nobody can become a seller**, so no bot can be published. Personal data in call logs is redacted. |
| `api/functions/checkout_payments.php` | `chargeCard()` performs full local card validation (required fields, Luhn, CVV format, expiry) and then **simulates** a successful charge — no gateway is contacted. It returns a `simulated` flag, which makes `MarketplaceController` write ledger rows as `pending_approval` so no withdrawable balance is created. `reconcilePayments()` and `processRefund()` reject with `503` / `FEATURE_UNAVAILABLE`; `handleParamCallback()` returns `200 OK` without processing (so a real gateway would not retry for hours) and `ensureParamMarketplaceTables()` does nothing. |
| `api/functions/producer_plan.php` | `buyProducerAccount()` always fails; `getProducerPlanStatus()` always reports no plan. |

> [!NOTE]
> `api/functions/phpmailer.php` and `api/functions/chatbot_limits.php` were previously stubs and are
> now real implementations — SMTP delivery via `functions/smtp_client.php`, and plan-driven limits via
> `functions/plans.php`.

## Troubleshooting

**All API calls fail with a 502 and `Backend sunucusuna ulaşılamıyor.`**
The PHP server is not running, or `PHP_TARGET` points elsewhere. `web/server.js` returns that JSON
body specifically so callers doing `JSON.parse(await res.text())` get a parseable error instead of a
syntax error. Check `GET /healthz` to confirm the Node process itself is up.

**`Veritabanı yapılandırması eksik: … tanımlı değil`**
One or more of `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` is missing from `api/.env`. All four must
be present; leave `DB_PASS=` empty for a password-less user.

**`Veritabanı bağlantısı başarısız`**
The four variables are set but MySQL rejected them or is unreachable.

**Admin panel: `/admin/` loads but `/admin/seo` returns 404**
The PHP server was started without `router.php`. Restart it as `php -S 127.0.0.1:8000 router.php`
from inside `api/`.

**Chat replies never arrive; the endpoint reports the AI service is not configured**
`API_GOOGLE_GEMINI` is set in neither the process environment, `api/.env`, nor `api/admin/.env`.
`AppConfig::googleGeminiApiKey()` checks all three, in that order, and returns an empty string when
none of them has it.

**Password-reset emails never arrive**
Configure SMTP — either `SMTP_*` in `api/.env` or the admin panel's SMTP settings page, which writes
the `smtp_host` / `smtp_email` / `smtp_pass` / `smtp_name` rows in `global_vars`. Delivery is
fail-closed: with no host configured, `sendEmail()` returns `success: false` rather than pretending
the code was sent. The code is **not** written to the error log.

**Seller registration always fails / no bot can be published**
Expected on a clean install: `ParamPosMarketplace.php` is a fail-closed stub, so sub-merchant
creation cannot succeed without the real Param POS integration.

**Refunds or reconciliation return 503**
Also expected — those two stubs reject explicitly rather than reporting a success that never
happened.

**Every 500 says `Sunucu hatası oluştu.` with no detail**
By design. Set `APP_DEBUG=true` in `api/.env` for local debugging; the real message is always written
to the error log regardless.

**`npm run export` or `npm run phpify` fails**
Both scripts are broken — see [Available Scripts](#available-scripts). Use
`NEXT_EXPORT=1 npm run build` for a static export.

**`npm start` behaves like the dev server**
`web/package.json`'s `start` script does not set `NODE_ENV`. Run `NODE_ENV=production node server.js`.

**A `next build` broke the running dev server**
A production build overwrote the dev server's `.next`, so the dev chunks it is still requesting are
gone. Restart the dev server, and use `NEXT_DIST_DIR=.next-verify` for verification builds.

**Turkish column and field names**
The database schema and most request payloads use Turkish identifiers (`kullanicilar`, `chatbotlar`,
`eposta`, `sifre`, `isim`, `aciklama`, `ucret_haftalik`). `AppConfig`'s `TABLE_*` constants are the
quickest map between the two vocabularies.

## Contributing

No contribution workflow, PR template, or CI configuration exists in this repository. Three
project-specific practices are documented in the code itself and should be preserved:

- **Never commit secrets.** `.gitignore` excludes `.env*` (except `*.env.example`), `db_backup/`,
  `*.sql` (with an explicit exception for `api/database/**/*.sql`), and the root-level `google.txt`,
  `customserver.txt` and `chatbot_table.txt` files, with a comment recording that those files
  previously contained real OAuth credentials and server connection details.
- **Change the three denylists together.** `api/.htaccess`, `api/admin/.htaccess` and
  `api/router.php` implement the same rules for three different deployment shapes; a rule added to
  one and not the others silently does nothing in the deployments it misses.
- **Keep the mirrored constants in sync.** Pricing, commission and message-allowance values are
  duplicated between `api/src/Shared/Constants/AppConfig.php`, `api/functions/coin_engine.php` and
  `web/src/shared/lib/pricing.js`. Change all of them together.

## License

No `LICENSE` file exists in this repository. The only license declaration is in
`api/composer.json`, which sets `"license": "proprietary"` for the `lumanoris/api` package. The
license status of `web/` could not be verified from the repository.
