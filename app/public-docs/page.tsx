import Link from "next/link";
import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import DocsNav from "@/components/docs-nav";
import CopyButton from "@/components/copy-button";
import Brand from "@/components/brand";
import { getSiteSettings } from "@/lib/settings";

const API_BASE =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const SECTIONS = [
  {
    id: "authentication",
    title: "Authentication",
    content: `Use API keys for programmatic access. Include in the Authorization header:

Authorization: Bearer YOUR_API_KEY

Create API keys from your dashboard.`,
  },
  {
    id: "public-collections",
    title: "Public Collections",
    content: `Read-only access without authentication.

List public collections:
GET ${API_BASE}/api/public

Get records from a public collection:
GET ${API_BASE}/api/public/{slug}?page=1&limit=20

Get a single record from a public collection:
GET ${API_BASE}/api/public/{slug}/{recordId}`,
  },
  {
    id: "private-collections",
    title: "Private Collections",
    content: `Requires authentication. Users can only access their own collections. Collection names must be unique per user.

List your collections:
GET ${API_BASE}/api/collection

Create a collection:
POST ${API_BASE}/api/collection
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{ "name": "My Collection", "description": "Optional description" }

Get a collection:
GET ${API_BASE}/api/collection/{collectionId}

Update a collection:
PATCH ${API_BASE}/api/collection/{collectionId}
{ "name": "New Name", "description": "Updated description" }

Delete a collection:
DELETE ${API_BASE}/api/collection/{collectionId}`,
  },
  {
    id: "records",
    title: "Records",
    content: `List records:
GET ${API_BASE}/api/collection/{collectionId}/{slug}?page=1&limit=20

Create a record:
POST ${API_BASE}/api/collection/{collectionId}/{slug}
{ "data": { "name": "John", "age": 30 } }

Update a record (partial merge):
PATCH ${API_BASE}/api/collection/{collectionId}/{slug}/{recordId}
{ "data": { "age": 31 } }

Replace a record (full replace):
PUT ${API_BASE}/api/collection/{collectionId}/{slug}/{recordId}
{ "data": { "name": "Jane", "role": "admin" } }

Delete a record:
DELETE ${API_BASE}/api/collection/{collectionId}/{slug}/{recordId}`,
  },
  {
    id: "pagination",
    title: "Pagination",
    content: `All list endpoints support pagination:

?page=1&limit=20

Response includes pagination metadata:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

Maximum page size: 100`,
  },
  {
    id: "errors",
    title: "Errors",
    content: `All errors follow this format:

{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message."
  }
}

Common error codes:
- 401 UNAUTHORIZED — Missing or invalid authentication
- 403 FORBIDDEN — Access denied
- 403 COLLECTION_LIMIT_REACHED — Free plan limit (5 collections)
- 403 RECORD_LIMIT_REACHED — Free plan limit (50 records per collection)
- 400 BAD_REQUEST — Invalid input or validation error
- 404 NOT_FOUND — Resource not found
- 409 CONFLICT — Resource already exists
- 413 PAYLOAD_TOO_LARGE — Request body too large
- 429 RATE_LIMITED — Too many requests`,
  },
  {
    id: "rate-limits",
    title: "Rate Limits",
    content: `Rate limits per minute:
- Anonymous: 60 requests
- Free: 120 requests
- Pro: 600 requests

When exceeded, returns 429 Too Many Requests.`,
  },
];

export default async function PublicDocsPage() {
  const activePlans = await db
    .select()
    .from(plans)
    .where(eq(plans.isActive, true))
    .orderBy(asc(plans.sortOrder));

  const settings = await getSiteSettings();
  const appName = settings.appName;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Brand
            appName={settings.appName}
            logoUrl={settings.logoUrl}
            textClassName="text-xl font-bold"
          />
          <DocsNav />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">API Documentation</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Complete reference for the {appName} REST API. No authentication
            required to read — sign up to start building.
          </p>
        </div>

        <div className="flex gap-8">
          {/* Table of Contents */}
          <nav className="sticky top-8 hidden h-fit w-56 shrink-0 lg:block">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              On this page
            </p>
            <ul className="space-y-1">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block truncate rounded px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-black dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
              {activePlans.length > 0 && (
                <li>
                  <a
                    href="#free-vs-pro"
                    className="block truncate rounded px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-black dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                  >
                    Free vs Pro
                  </a>
                </li>
              )}
            </ul>
          </nav>

          {/* Content */}
          <div className="min-w-0 flex-1 space-y-8">
            {SECTIONS.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-20 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800"
              >
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <div className="relative mt-3">
                  <pre className="whitespace-pre-wrap rounded bg-zinc-50 p-4 text-sm dark:bg-zinc-950">
                    {section.content}
                  </pre>
                  <CopyButton text={section.content} />
                </div>
              </section>
            ))}

            {/* Dynamic Free vs Pro */}
            {activePlans.length > 0 && (
              <section
                id="free-vs-pro"
                className="scroll-mt-20 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800"
              >
                <h2 className="text-lg font-semibold">Free vs Pro</h2>
                <div
                  className={`mt-4 grid gap-6 ${
                    activePlans.length === 1
                      ? "sm:grid-cols-1"
                      : "sm:grid-cols-2"
                  }`}
                >
                  {activePlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800"
                    >
                      <h3 className="font-semibold">{plan.name}</h3>
                      <p className="mt-1 text-2xl font-bold">{plan.price}</p>
                      <ul className="mt-3 space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                        {(plan.features as string[]).map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* CTA */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-xl font-bold">Ready to get started?</h2>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Create a free account to build collections, manage records, and
                access the full API.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Link
                  href="/register"
                  className="rounded-md bg-black px-6 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-black"
                >
                  Sign up free
                </Link>
                <Link
                  href="/public-api"
                  className="rounded-md border border-zinc-300 px-6 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  Try the API
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <p>&copy; {new Date().getFullYear()} {appName}. All rights reserved.</p>
      </footer>
    </div>
  );
}
