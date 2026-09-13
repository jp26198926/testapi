import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

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
GET ${API_BASE}/api/public/{slug}?page=1&limit=20

Get a single record from a public collection:
GET ${API_BASE}/api/public/{slug}/{recordId}`,
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
GET ${API_BASE}/api/collection/{collectionId}

Update a collection:
PATCH ${API_BASE}/api/collection/{collectionId}
{ "name": "New Name", "description": "Updated description" }

Delete a collection:
DELETE ${API_BASE}/api/collection/{collectionId}`,
  },
  {
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
    title: "File Upload",
    content: `Upload an image to Cloudinary:
POST ${API_BASE}/api/upload
Content-Type: multipart/form-data

Send a file field named "file" with the image data.`,
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
- 403 COLLECTION_LIMIT_REACHED — Free plan limit (5 collections)
- 403 RECORD_LIMIT_REACHED — Free plan limit (50 records per collection)
- 400 BAD_REQUEST — Invalid input or validation error
- 404 NOT_FOUND — Resource not found
- 409 CONFLICT — Resource already exists
- 413 PAYLOAD_TOO_LARGE — Request body too large
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
];

export default async function DocsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const activePlans = await db
    .select()
    .from(plans)
    .where(eq(plans.isActive, true))
    .orderBy(asc(plans.sortOrder));

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

        {activePlans.length > 0 && (
          <section className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
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
      </div>
    </div>
  );
}
