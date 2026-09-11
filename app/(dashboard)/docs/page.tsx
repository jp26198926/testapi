import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const SECTIONS = [
  {
    title: "Authentication",
    content: `Use API keys for programmatic access. Include in the Authorization header:

Authorization: Bearer YOUR_API_KEY

Create API keys from your dashboard.`,
  },
  {
    title: "Public Collections",
    content: `Read-only access without authentication.

List public collections:
GET ${API_BASE}/api/public

Get records from a public collection:
GET ${API_BASE}/api/public/posts?page=1&limit=20

Get a single record:
GET ${API_BASE}/api/public/posts/1`,
  },
  {
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
GET ${API_BASE}/api/collection/:id

Update a collection:
PATCH ${API_BASE}/api/collection/:id
{ "name": "New Name", "description": "Updated description" }

Delete a collection:
DELETE ${API_BASE}/api/collection/:id`,
  },
  {
    title: "Records",
    content: `List records:
GET ${API_BASE}/api/collection/:id/:slug?page=1&limit=20

Create a record:
POST ${API_BASE}/api/collection/:id/:slug
{ "data": { "name": "John", "age": 30 } }

Update a record (partial):
PATCH ${API_BASE}/api/collection/:id/:slug/:recordId
{ "data": { "age": 31 } }

Replace a record:
PUT ${API_BASE}/api/collection/:id/:slug/:recordId
{ "data": { "name": "Jane", "role": "admin" } }

Delete a record:
DELETE ${API_BASE}/api/collection/:id/:slug/:recordId`,
  },
  {
    title: "API Keys",
    content: `List your API keys:
GET ${API_BASE}/api/keys

Create a new API key:
POST ${API_BASE}/api/keys
{ "name": "My Key" }

Revoke an API key:
DELETE ${API_BASE}/api/keys/:keyId`,
  },
  {
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
- 403 COLLECTION_LIMIT_REACHED — Free plan limit
- 403 RECORD_LIMIT_REACHED — Free plan limit
- 404 NOT_FOUND — Resource not found
- 429 RATE_LIMITED — Too many requests`,
  },
  {
    title: "Rate Limits",
    content: `Rate limits per minute:
- Anonymous: 60 requests
- Free: 120 requests
- Pro: 600 requests

When exceeded, returns 429 Too Many Requests.`,
  },
  {
    title: "Free vs Pro",
    content: `Free plan:
- 5 collections maximum
- 50 records per collection
- 120 requests/minute

Pro plan ($9/month):
- Unlimited collections
- Unlimited records
- 600 requests/minute`,
  },
];

export default function DocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">API Documentation</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Complete reference for the TESTAPI REST API.
        </p>
      </div>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section
            key={section.title}
            className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800"
          >
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <pre className="mt-3 whitespace-pre-wrap rounded bg-zinc-50 p-4 text-sm dark:bg-zinc-950">
              {section.content}
            </pre>
          </section>
        ))}
      </div>
    </div>
  );
}
