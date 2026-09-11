<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

## Stack & versions

- Next.js **16.3.4** (App Router) — React **19.2.8**
- Tailwind CSS **v4** via `@tailwindcss/postcss` (no `tailwind.config.js`; config goes in CSS `@theme`)
- TypeScript strict mode, `@/*` path alias → project root
- ESLint **9** flat config (`eslint.config.mjs`) using `eslint-config-next`
- Planned but not yet added: Drizzle ORM + PostgreSQL, Better Auth, PayPal SDK, Cloudinary, Zod

## Commands

```bash
npm run dev       # next dev — local dev server at localhost:3000
npm run build     # next build — production build
npm run start     # next start — serve production build
npm run lint      # eslint (flat config)
```

No test script exists yet. A testing framework needs to be chosen and configured.

## Project spec

`instruction.md` is the full product spec (SaaS CRUD API platform). Read it before implementing anything. Key constraints:

- **Security is priority #1.** Backend is always authoritative; never trust client-supplied plan/ownership info.
- **Three user tiers:** Anonymous (public read-only), Free (5 collections, 50 records each), Pro (unlimited via PayPal subscription).
- **API design:** RESTful CRUD under `/api/public/[collection]` (read-only) and `/api/collections/[id]/records/[id]`. Consistent JSON response envelope: `{ data }`, `{ data, pagination }`, or `{ error: { code, message } }`.
- **Auth:** Better Auth (email/password). API-key auth for programmatic access (hashed storage, prefix display).
- **DB:** PostgreSQL + Drizzle ORM. Records use JSONB `data` column for flexible schemas.
- **Billing:** PayPal monthly subscriptions with webhook-driven state sync. Expired Pro auto-downgrades to Free without deleting data.
- **Rate limiting, input validation, security headers** are all required.

## Environment variables

`.env*` files are gitignored. Required variables (create `.env.example` with names only, no secrets):

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/testapi
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
ADMIN_EMAIL=
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM / SMTP_FROM_NAME / SMTP_SECURE
CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
NEXT_PUBLIC_PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET / NEXT_PUBLIC_PAYPAL_ENVIRONMENT
```

## Architecture guidance

- **App Router only** — no `pages/` directory. Route handlers go in `app/**/route.ts`. A `route.ts` and `page.ts` cannot coexist at the same segment.
- Server Components by default; add `"use client"` only when interactivity/state/effects are needed.
- Do not put business logic in route handlers — extract reusable server-side services for auth, ownership checks, plan enforcement, validation, and rate limiting.
- Use `LayoutProps` type (provided by Next.js 16) for layout component props.
- This Next.js version ships docs in `node_modules/next/dist/docs/` — consult them before writing code, especially for route handlers, caching, and server/client boundaries.

## Git

Remote: `https://github.com/jp26198926/testapi.git`
Push to the repository periodically during development.
