# TESTAPI

A secure CRUD API SaaS platform built with Next.js 16, TypeScript, Tailwind CSS v4, Drizzle ORM, PostgreSQL, and Better Auth. Create collections, manage records, and test API endpoints with a real RESTful API.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- SMTP server (for password reset emails)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` from the example:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials, auth secret, and SMTP settings.

3. **Generate and run database migrations:**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. **Seed initial data (plans, settings, public collections):**
   ```bash
   npm run db:seed
   ```

5. **Start the dev server:**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Random secret (32+ chars) for session encryption |
| `BETTER_AUTH_URL` | Yes | App base URL (e.g. `http://localhost:3000`) |
| `ADMIN_EMAIL` | Yes | Email for the admin account |
| `SMTP_HOST` | Yes* | SMTP server host |
| `SMTP_PORT` | Yes* | SMTP server port |
| `SMTP_USER` | Yes* | SMTP username |
| `SMTP_PASS` | Yes* | SMTP password |
| `SMTP_FROM` | Yes* | Sender email address |
| `SMTP_FROM_NAME` | No | Sender display name |
| `SMTP_SECURE` | No | `true` for TLS (port 465) |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name (for file uploads) |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | No | PayPal client ID (for subscriptions) |
| `PAYPAL_CLIENT_SECRET` | No | PayPal client secret |
| `NEXT_PUBLIC_PAYPAL_ENVIRONMENT` | No | `sandbox` or `production` |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL (defaults to `http://localhost:3000`) |

*SMTP is required for the forgot password feature to send reset emails.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migration |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed plans, settings, and public collections |

## Pages

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page with features and pricing |
| `/public-api` | Public | Browse and explore public collections |
| `/public-docs` | Public | API documentation (no auth required) |
| `/login` | Public | Sign in with email/password |
| `/register` | Public | Create a new account |
| `/forgot-password` | Public | Request a password reset link |
| `/reset-password` | Public | Set new password via token |
| `/dashboard` | Authenticated | User dashboard |
| `/collections` | Authenticated | Manage collections |
| `/keys` | Authenticated | Manage API keys |
| `/playground` | Authenticated | Interactive API playground |
| `/docs` | Authenticated | API documentation (authenticated view) |
| `/billing` | Authenticated | Subscription management |
| `/settings` | Admin | Site settings |

## Architecture

- **App Router** (`app/`) — Next.js 16 with Server Components by default
- **API Routes** (`app/api/`) — RESTful CRUD endpoints under `/api/`
- **Auth** — Better Auth with email/password, sessions, API keys, and password reset via email
- **Database** — PostgreSQL via Drizzle ORM, JSONB for flexible record schemas
- **Email** — Nodemailer with SMTP for password reset emails
- **Rate Limiting** — In-memory per-tier rate limiting

## API Overview

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/public` | No | List public collections |
| `GET /api/public/:slug` | No | Get records from a public collection |
| `GET /api/public/:slug/:id` | No | Get a single public record |
| `GET /api/collection` | Yes | List your collections |
| `POST /api/collection` | Yes | Create a collection |
| `GET /api/collection/:id` | Yes | Get a collection |
| `PATCH /api/collection/:id` | Yes | Update a collection |
| `DELETE /api/collection/:id` | Yes | Delete a collection |
| `GET /api/collection/:id/:slug` | Yes | List records in a collection |
| `POST /api/collection/:id/:slug` | Yes | Create a record |
| `PATCH /api/collection/:id/:slug/:rid` | Yes | Update a record (partial) |
| `PUT /api/collection/:id/:slug/:rid` | Yes | Replace a record (full) |
| `DELETE /api/collection/:id/:slug/:rid` | Yes | Delete a record |
| `GET /api/keys` | Yes | List API keys |
| `POST /api/keys` | Yes | Create an API key |
| `GET /api/keys/:id/reveal` | Yes | Reveal an API key |
| `DELETE /api/keys/:id` | Yes | Revoke an API key |
| `GET /api/subscriptions` | Yes | Get subscription status |
| `POST /api/subscriptions` | Yes | Create PayPal subscription |
| `GET /api/subscriptions/history` | Yes | Subscription history |
| `GET /api/payments` | Yes | Payment records |
| `GET /api/plans` | No | List active plans |
| `GET /api/settings` | No | Get site settings |
| `POST /api/upload` | Yes | Upload a file to Cloudinary |

## Plans

Plans are stored in the database and managed via the admin settings page. Default plans:

| | Free | Pro ($9/mo) |
|---|---|---|
| Collections | 5 | Unlimited |
| Records/collection | 50 | Unlimited |
| Rate limit | 120/min | 600/min |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Better Auth (email/password, API keys)
- **Email:** Nodemailer (SMTP)
- **Payments:** PayPal SDK
- **File Storage:** Cloudinary
