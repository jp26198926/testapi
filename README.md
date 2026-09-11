# TESTAPI

A secure public CRUD API SaaS platform built with Next.js 16, TypeScript, Tailwind CSS v4, Drizzle ORM, PostgreSQL, and Better Auth.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` from the example:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your PostgreSQL credentials, Better Auth secret, and any optional keys.

3. **Generate and run database migrations:**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. **Seed public collections (optional):**
   ```bash
   npm run db:seed
   ```

5. **Start the dev server:**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:generate` | Generate Drizzle migration |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed public collections |

## Architecture

- **App Router** (`app/`) — Next.js 16 with Server Components by default
- **API Routes** (`app/api/`) — RESTful CRUD endpoints
- **Auth** — Better Auth with email/password, sessions, and API key authentication
- **Database** — PostgreSQL via Drizzle ORM, JSONB for flexible record data
- **Validation** — Zod v4 schemas
- **Rate Limiting** — In-memory per-user rate limiting by tier

## API Overview

| Endpoint | Description |
|----------|-------------|
| `GET /api/public` | List public collections |
| `GET /api/public/:slug` | Get records from a public collection |
| `GET /api/collections` | List your collections (auth required) |
| `POST /api/collections` | Create a collection |
| `GET/DELETE /api/collections/:id` | Get/delete a collection |
| `GET/POST /api/collections/:id/records` | List/create records |
| `GET/PATCH/PUT/DELETE /api/collections/:id/records/:rid` | Record CRUD |
| `GET/POST /api/keys` | List/create API keys |
| `DELETE /api/keys/:id` | Revoke an API key |
| `GET /api/subscriptions` | Get subscription status |
| `POST /api/subscriptions` | Create PayPal subscription |

## Plans

| | Free | Pro ($9/mo) |
|---|---|---|
| Collections | 5 | Unlimited |
| Records/collection | 50 | Unlimited |
| Rate limit | 120/min | 600/min |
