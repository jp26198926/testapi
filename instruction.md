# Build a Secure Public CRUD API SaaS Platform

You are a senior full-stack engineer and SaaS architect. Build a production-ready, secure, mobile-responsive SaaS web application that allows users to experiment with and consume a RESTful CRUD API.

The application should provide:

1. Public predefined collections that anonymous users can read.
2. Authentication for registered users.
3. Private collections for authenticated users.
4. CRUD operations through a web interface and API.
5. Free and Pro subscription plans.
6. Usage limits based on the user's plan.
7. PayPal monthly subscriptions for the Pro plan.
8. Automatic downgrade to the Free plan when the Pro subscription expires/cancels.
9. API documentation and an interactive API playground.
10. Strong SaaS-grade security.

---

# APP NAME

- TESTAPI

---

# IMPORTANT DEVELOPMENT RULE

Before writing or modifying ANY code:

- Always consult the latest official online documentation for the relevant technology.
- Do not rely on outdated knowledge or deprecated APIs.
- Verify the current APIs and recommended implementation patterns.
- Prefer official documentation over blog posts or unofficial tutorials.

Official documentation should be checked for at least:

- Next.js
- React
- Tailwind CSS
- Better Auth
- Drizzle ORM
- PostgreSQL
- Cloudinary
- PayPal
- Any other library introduced into the project

When there is a conflict between this specification and current framework documentation, preserve the intended functionality while using the current recommended implementation.

Do not introduce unnecessary dependencies.

---

# TECH STACK

Use the latest stable versions available at development time.

## Frontend / Full Stack

- Next.js
- TypeScript
- React
- Tailwind CSS

Use the current recommended Next.js architecture and routing conventions.

Prefer Server Components where appropriate and Client Components only where interactivity requires them.

## Authentication

- Better Auth

Authentication should support:

- Email/password registration
- Login
- Logout
- Session management
- Secure password handling
- Protected routes
- User account management

Design authentication so it can later support additional providers without requiring a major architectural rewrite.

---

# DATABASE

Use:

- PostgreSQL
- Drizzle ORM

Create a properly normalized database schema.

At minimum, model:

- users
- sessions
- accounts/authentication data required by Better Auth
- collections
- records
- subscriptions
- API keys, if API-key authentication is implemented
- usage/limits where required
- payment/provider identifiers
- timestamps
- ownership relationships

Use foreign keys and appropriate indexes.

Collections must belong to exactly one authenticated user.

Records must belong to exactly one collection.

Do not trust ownership information supplied by the client.

Always derive ownership from the authenticated server-side session/user identity.

---

# CORE CONCEPT

The application is a public API server with a web-based API playground.

Users should be able to interact with resources using standard CRUD operations:

- GET
- POST
- PUT/PATCH
- DELETE

The API should return predictable JSON responses.

Design the API so it can be easily consumed by:

- JavaScript applications
- Mobile applications
- Python applications
- cURL
- Postman
- Other HTTP clients

---

# USER TYPES

There are three primary access states:

## 1. Anonymous User

An anonymous user can:

- Visit the website.
- View documentation.
- View predefined public collections.
- Read/fetch data from predefined public collections.
- Use GET requests against public collections.
- Try the API playground.
- View example request/response payloads.
- Register for an account.

Anonymous users CANNOT:

- Create collections.
- Create records in private collections.
- Update records.
- Delete records.
- Access private collections.
- Access another user's private data.
- Access authenticated CRUD endpoints without authentication.

Do not allow anonymous users to bypass authorization simply by manipulating URLs, IDs, query parameters, or request bodies.

---

# 2. Authenticated FREE User

A logged-in Free user can:

- Read public collections.
- Use CRUD operations on their own private collections.
- Create private collections.
- Create records.
- Read records.
- Update records.
- Delete records.
- Manage their own collections.

Limits:

### Collections

Maximum:

**5 collections per user**

### Records

Maximum:

**50 records per collection**

The limits must be enforced on the server.

Do not rely on frontend validation.

For example:

If a Free user already has 5 collections, the server must reject:

```http
POST /api/collections
```

with an appropriate error response.

If a collection already contains 50 records, the server must reject attempts to create the 51st record.

The API and UI must both enforce the same limits.

---

# 3. Authenticated PRO User

A logged-in Pro user receives:

- Everything available to Free users.
- Unlimited collections.
- Unlimited records.
- Full CRUD operations.
- Private collections.
- Private records.
- Pro-only functionality where appropriate.

There should be no artificial application-level limit on:

- Number of collections
- Number of records per collection

However, implement reasonable infrastructure safeguards against abuse, such as:

- Request rate limiting
- Request body size limits
- Pagination
- Query limits
- Database protections
- API abuse protection

"Unlimited" means no normal product quota, not unlimited infrastructure abuse.

---

# COLLECTION VISIBILITY

User-created collections are ALWAYS private.

Only the owner can:

- View the collection.
- View its records.
- Create records.
- Update records.
- Delete records.
- Delete the collection.
- Modify the collection.

Never expose another user's private collection.

Example:

User A owns:

```text
collection_id = abc123
```

User B must receive an authorization error when attempting:

```http
GET /api/collections/abc123
```

even if User B knows the ID.

Use server-side ownership checks for every private resource.

Do not assume obscurity of IDs is a security mechanism.

---

# PUBLIC COLLECTIONS

The system should include predefined public collections that can be used without authentication.

Examples:

```text
/posts
/users
/comments
/products
/todos
```

The exact public collections can be determined during implementation.

Public collections should contain realistic sample data.

Anonymous users should be able to perform read operations such as:

```http
GET /api/public/posts
GET /api/public/posts/1
```

Do not allow anonymous users to modify predefined public data unless explicitly enabled by the application administrator.

Public resources should be clearly marked as:

```text
PUBLIC
```

in the UI.

---

# API DESIGN

Design a clean REST API.

Example structure:

```text
/api/public/[collection]
/api/public/[collection]/[id]

/api/collections
/api/collections/[collectionId]

/api/collections/[collectionId]/records
/api/collections/[collectionId]/records/[recordId]
```

You may adjust the exact routes if the current Next.js architecture recommends a better structure.

The API should support:

### List

```http
GET /api/collections/:collectionId/records
```

### Get one

```http
GET /api/collections/:collectionId/records/:recordId
```

### Create

```http
POST /api/collections/:collectionId/records
```

### Update

```http
PATCH /api/collections/:collectionId/records/:recordId
```

### Replace

```http
PUT /api/collections/:collectionId/records/:recordId
```

### Delete

```http
DELETE /api/collections/:collectionId/records/:recordId
```

---

# API REQUEST FORMAT

For example:

```http
POST /api/collections/abc123/records
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

Body:

```json
{
  "name": "John",
  "email": "john@example.com",
  "age": 30
}
```

The API should return JSON.

Example successful response:

```json
{
  "data": {
    "id": "record-id",
    "name": "John",
    "email": "john@example.com",
    "age": 30
  }
}
```

Use consistent error responses.

Example:

```json
{
  "error": {
    "code": "COLLECTION_LIMIT_REACHED",
    "message": "Free users can create a maximum of 5 collections."
  }
}
```

Do not expose sensitive implementation details in error messages.

---

# DYNAMIC RECORD SCHEMA

Collections should support flexible JSON-like records because this is intended to be a CRUD API playground.

A record might contain:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "active": true
}
```

Another record could contain:

```json
{
  "title": "Example post",
  "content": "Hello world",
  "published": true
}
```

Use PostgreSQL's JSONB capabilities where appropriate.

Do not require every user collection to have a rigid database table.

Design the schema so records can safely store structured JSON data while still having:

- Record ID
- Collection ID
- Creation timestamp
- Update timestamp

Validate incoming JSON.

Prevent excessively large payloads.

---

# PAGINATION

Never return an unlimited number of records in a single API request.

Implement pagination.

Example:

```http
GET /api/collections/abc123/records?page=1&limit=20
```

Return metadata such as:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

Enforce a maximum page size server-side.

For example, even if a client requests:

```text
limit=1000000
```

the server should cap or reject the request.

---

# API KEYS

Design secure API-key authentication for programmatic API access.

Users should be able to create API keys from their dashboard.

API keys should:

- Be generated using cryptographically secure randomness.
- Never be stored in plaintext.
- Be displayed in full only when initially created.
- Be stored as secure hashes.
- Support revocation.
- Have a human-readable name.
- Have creation timestamps.
- Have optional expiration.
- Be scoped appropriately.

Example UI:

```text
API Keys

My Development Key
Created: Sep 10, 2026
Last used: Sep 10, 2026

[Revoke]
```

Use an appropriate secure format such as:

```text
pk_live_xxxxxxxxxxxxxxxxx
```

or another suitable convention.

Do not log complete API keys.

Never expose API keys to unauthorized users.

---

# AUTHORIZATION

Implement authorization at the server/API layer.

Never rely solely on:

- UI visibility
- Hidden buttons
- Client-side route protection
- React state
- Request parameters

Every protected API operation must independently verify:

1. Authentication.
2. User identity.
3. Resource ownership.
4. Subscription/plan permissions.
5. Usage limits.
6. Request validity.

---

# PLAN MANAGEMENT

Represent plans internally using something like:

```text
FREE
PRO
```

Do not determine a user's plan from client-side information.

The server must determine the user's current subscription state.

---

# FREE PLAN

Default new accounts to:

```text
FREE
```

Free plan:

```text
Maximum collections: 5
Maximum records per collection: 50
```

When a Free user reaches a limit, provide a useful response encouraging them to upgrade.

Example:

```json
{
  "error": {
    "code": "RECORD_LIMIT_REACHED",
    "message": "You've reached the 50-record limit for the Free plan.",
    "upgradeRequired": true
  }
}
```

---

# PRO PLAN

Pro is a monthly subscription.

Pro users have:

```text
Collections: Unlimited
Records: Unlimited
```

Use PayPal for subscription billing.

Do not implement billing by trusting frontend payment success.

The backend must verify subscription status through PayPal's official APIs/webhooks.

---

# PAYPAL SUBSCRIPTION

Implement recurring monthly billing using PayPal's current subscription APIs.

Before implementation:

- Read the latest official PayPal subscription documentation.
- Use the currently recommended SDK/API approach.
- Use sandbox during development.
- Keep credentials in environment variables.
- Never expose PayPal secrets to the browser.

The subscription lifecycle should support states such as:

```text
ACTIVE
CANCELLED
EXPIRED
SUSPENDED
```

Use the appropriate current PayPal states according to the latest documentation.

---

# PAYPAL WEBHOOKS

Implement secure PayPal webhook handling.

Webhooks should be used to synchronize subscription state.

Handle relevant events such as:

- Subscription activated
- Subscription renewed
- Subscription cancelled
- Subscription suspended
- Subscription expired
- Payment-related failures where applicable

Verify webhook authenticity according to current PayPal documentation.

Do not simply trust arbitrary HTTP requests claiming:

```text
subscriptionStatus = ACTIVE
```

Webhook processing must be idempotent.

The same webhook event should not create duplicate subscription records or corrupt the user's subscription state.

Store the PayPal subscription ID.

Store relevant provider event IDs.

---

# AUTOMATIC DOWNGRADE

If a Pro subscription expires or is no longer active:

The user should automatically return to:

```text
FREE
```

However, carefully handle existing Pro data.

For example, a user could have:

```text
20 collections
500 records
```

while Pro is active.

After downgrade, the user exceeds the Free limits.

DO NOT silently delete their data.

Instead:

- Keep existing data.
- Mark the account as Free.
- Prevent creation of additional collections/records beyond Free limits.
- Allow the user to access/manage existing data according to a clearly defined downgrade policy.
- Clearly explain what is restricted.
- Provide an upgrade option.

Design this behavior explicitly rather than deleting data.

---

# SUBSCRIPTION PAGE

Create a pricing/subscription page.

Example:

## Free

```text
$0/month

✓ Public API access
✓ 5 private collections
✓ 50 records per collection
✓ CRUD API
✓ API playground
✓ API keys
```

## Pro

```text
$X/month

✓ Everything in Free
✓ Unlimited collections
✓ Unlimited records
✓ Higher usage limits
✓ Priority features
```

The actual Pro price should be configurable rather than hardcoded throughout the application.

Show:

- Current plan
- Subscription status
- Renewal information where available
- Upgrade button
- Manage/cancel subscription functionality
- Payment status

---

# DASHBOARD

Create an intuitive authenticated dashboard.

Suggested navigation:

```text
Dashboard
Collections
API Keys
API Playground
Documentation
Billing
Settings
```

Dashboard overview should show:

```text
Current Plan
Collections Used
Records Used
API Requests
Subscription Status
```

For Free:

```text
Collections
3 / 5

Records
42 / 50
```

For Pro:

```text
Collections
Unlimited

Records
Unlimited
```

---

# COLLECTION MANAGEMENT

Users should be able to:

- Create a collection.
- View collections.
- Open a collection.
- Rename a collection.
- Delete a collection.
- View records.
- Add records.
- Edit records.
- Delete records.

Collection creation form:

```text
Collection Name
Description
```

Validate collection names.

Prevent:

- Empty names.
- Excessively long names.
- Invalid characters if they are used in URL paths.
- Duplicate names where uniqueness is required.

Use safe identifiers rather than directly using user-provided collection names as database identifiers.

---

# RECORD MANAGEMENT UI

Create an intuitive record editor.

Users should be able to enter JSON such as:

```json
{
  "name": "Jane",
  "email": "jane@example.com",
  "role": "admin"
}
```

Provide:

- JSON validation.
- Syntax highlighting where appropriate.
- Clear validation errors.
- Pretty formatting.
- Edit/create/delete controls.

Do not execute user-provided JavaScript.

Treat all user data as untrusted data.

---

# API PLAYGROUND

This is an important feature.

Create an interactive API playground where users can test the API.

Example interface:

```text
Method     GET ▼
Endpoint   /api/collections/users/records
```

Request headers:

```text
Authorization: Bearer ...
Content-Type: application/json
```

Request body:

```json
{
  "name": "John"
}
```

Response:

```json
{
  "data": [...]
}
```

Features:

- HTTP method selector.
- Endpoint selector/input.
- Headers editor.
- JSON request body editor.
- Send button.
- Response viewer.
- Status code.
- Response time.
- Copy request.
- Copy response.
- Reset.
- Clear.

Make the playground easy for beginners.

---

# API DOCUMENTATION

Create documentation explaining:

- Authentication
- API keys
- Public resources
- Private collections
- CRUD operations
- Request formats
- Response formats
- Pagination
- Errors
- Rate limits
- Free limits
- Pro limits
- Examples

Include cURL examples.

Example:

```bash
curl https://example.com/api/public/posts
```

Authenticated example:

```bash
curl \
  -H "Authorization: Bearer YOUR_API_KEY" \
  https://example.com/api/collections/abc123/records
```

Create documentation that is useful to developers who have never used the platform before.

---

# RATE LIMITING

Because this is a public API SaaS application, implement rate limiting.

At minimum consider separate limits for:

- Anonymous requests.
- Authenticated Free users.
- Pro users.
- Authentication endpoints.
- API-key endpoints.
- Expensive database operations.

Do not implement rate limiting solely in browser code.

Use a production-appropriate approach.

If an external service is required for distributed rate limiting, document the dependency.

Return:

```http
429 Too Many Requests
```

when appropriate.

Do not expose internal infrastructure details.

---

# SECURITY REQUIREMENTS

Treat security as a first-class requirement.

Implement protections against:

## Authentication attacks

Protect against:

- Brute-force login attempts.
- Credential stuffing.
- Session theft.
- Session fixation.
- Weak passwords.
- Account enumeration where applicable.

Use Better Auth's current recommended security configuration.

---

## Authorization attacks

Prevent:

- IDOR
- Broken access control
- Privilege escalation
- Access to another user's collections
- Access to another user's records
- Free → Pro privilege spoofing

Every database query involving private resources must enforce ownership.

---

## Injection

Protect against:

- SQL injection
- JSON injection
- Header injection
- Command injection
- XSS

Use Drizzle's parameterized query mechanisms.

Never concatenate user input into SQL.

---

## XSS

All user-provided content must be treated as untrusted.

Be particularly careful with:

- Collection names.
- Record JSON.
- Descriptions.
- API responses.
- Documentation generated from user input.

Do not use unsafe HTML rendering unless absolutely necessary.

---

## CSRF

Use the current Next.js/Better Auth security recommendations for state-changing browser requests.

Protect authenticated state-changing operations appropriately.

---

## SSRF

Do not create functionality that allows users to provide arbitrary server-side URLs unless it is explicitly required.

The API playground should send requests from the user's browser where possible rather than turning the application into an unrestricted server-side proxy.

---

## Request validation

Validate:

- HTTP method.
- Content type.
- JSON structure.
- Request body size.
- Query parameters.
- IDs.
- Pagination values.
- Collection names.

Reject malformed requests with appropriate HTTP status codes.

---

# SECURITY HEADERS

Configure appropriate security headers.

Consider:

- Content-Security-Policy
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- Strict-Transport-Security in production
- Appropriate frame protections

Use the current Next.js recommendations.

Do not blindly copy a generic security-header configuration without checking compatibility with the application.

---

# SECRETS

Never commit secrets to source control.

Use environment variables for:

```text
DATABASE_URL
BETTER_AUTH_SECRET
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_WEBHOOK_ID
PAYPAL_PLAN_ID
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Use appropriate additional environment variables as required.

Create:

```text
.env.example
```

containing variable names but NO real secrets.

---

# CLOUDINARY

Use Cloudinary where appropriate for user-uploaded assets.

Potential use cases:

- User avatar.
- Collection-related images.
- Documentation images.
- Other SaaS media.

Before implementation, read the latest official Cloudinary documentation.

Security requirements:

- Never expose Cloudinary API secrets.
- Validate uploaded files.
- Restrict file types.
- Restrict file size.
- Generate secure upload signatures where appropriate.
- Do not allow arbitrary dangerous file uploads.

If Cloudinary is not required for the initial MVP functionality, integrate it cleanly without unnecessarily complicating the core CRUD API.

---

# DATABASE SECURITY

Use proper database constraints.

Examples:

- Foreign keys.
- Unique constraints where appropriate.
- Indexes.
- NOT NULL constraints.
- Cascading behavior carefully considered.

Be especially careful with deletion.

If a collection is deleted, decide explicitly whether its records should also be deleted.

For user-owned collections, cascading deletion of child records is acceptable if implemented intentionally and safely.

Never allow a user to delete records belonging to another collection.

---

# TRANSACTIONS

Use database transactions for operations where multiple writes must succeed or fail together.

For example:

- Creating subscription-related state.
- Creating a collection and associated metadata.
- Deleting a collection and its dependent data where required.

Pay particular attention to race conditions around Free plan limits.

For example, two simultaneous requests must NOT allow a Free user with 49 records to create two records and end up with 51.

Enforce limits atomically at the database/application level.

---

# API ERROR HANDLING

Use consistent HTTP status codes.

Examples:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
413 Payload Too Large
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
```

Do not return stack traces to users.

Log detailed errors server-side while returning safe messages to clients.

---

# LOGGING

Implement structured server-side logging.

Log useful information such as:

- Request ID.
- User ID where appropriate.
- API route.
- HTTP method.
- Status code.
- Duration.
- Error category.

Never log:

- Passwords.
- Session secrets.
- API keys.
- PayPal client secrets.
- Cloudinary secrets.
- Authorization headers.
- Sensitive user data unnecessarily.

---

# AUDITABILITY

Consider recording important security/account events:

- Login.
- Logout.
- Password changes.
- API key creation.
- API key revocation.
- Collection creation.
- Collection deletion.
- Subscription changes.

Do not store unnecessary sensitive information.

---

# MOBILE RESPONSIVENESS

The entire application must be mobile responsive.

Design mobile-first using Tailwind CSS.

The application should work well on:

- Mobile phones.
- Tablets.
- Laptops.
- Desktop monitors.

Do not simply shrink the desktop layout.

On mobile:

- Navigation should become a usable menu.
- Tables should become cards or horizontally scrollable containers where appropriate.
- Forms should remain easy to use.
- JSON editors should remain usable.
- Buttons should have touch-friendly sizing.
- Modals should fit smaller screens.

---

# UI/UX

Create a clean developer-focused SaaS interface.

The design should feel:

- Modern.
- Minimal.
- Professional.
- Fast.
- Intuitive.
- Developer-friendly.

Prioritize usability over visual complexity.

Important UI states:

- Loading.
- Empty.
- Success.
- Error.
- Unauthorized.
- Limit reached.
- Subscription expired.
- Network failure.

Never leave the user wondering whether an action succeeded.

Use confirmation dialogs for destructive operations such as:

```text
Delete collection?
```

Clearly explain that deleting a collection may permanently delete its records.

---

# ACCESSIBILITY

Follow modern accessibility practices.

Use:

- Semantic HTML.
- Keyboard navigation.
- Visible focus states.
- Proper labels.
- Accessible dialogs.
- Appropriate ARIA attributes when necessary.
- Sufficient contrast.
- Screen-reader-friendly status messages.

Do not make important actions dependent on hover.

---

# PERFORMANCE

Optimize for performance.

Consider:

- Server Components.
- Streaming where useful.
- Database indexes.
- Pagination.
- Efficient queries.
- Avoiding unnecessary client-side JavaScript.
- Caching public resources where appropriate.
- Avoiding N+1 queries.

Do not cache private user data incorrectly.

Ensure cached responses cannot leak one user's data to another user.

---

# SEO / PUBLIC LANDING PAGE

Create a public landing page explaining:

```text
Your API playground for learning and testing CRUD APIs.
```

Sections:

- Hero.
- How it works.
- Public API.
- CRUD playground.
- Free plan.
- Pro plan.
- Developer-focused benefits.
- Documentation.
- FAQ.
- Call to action.

Authenticated dashboard pages do not need to be publicly indexed.

---

# ADMIN CONSIDERATIONS

Design the database/application so an admin role can be introduced later.

Do not implement a complex admin dashboard unless necessary for the MVP.

However, avoid architecture that assumes every user is always a normal user.

---

# DATABASE SCHEMA EXPECTATION

Design a schema along these conceptual lines:

```text
User
 ├── Sessions
 ├── Accounts
 ├── API Keys
 ├── Collections
 │    └── Records
 └── Subscription
```

A Collection should contain approximately:

```text
id
userId
name
description
createdAt
updatedAt
```

A Record:

```text
id
collectionId
data JSONB
createdAt
updatedAt
```

An API key:

```text
id
userId
name
keyHash
keyPrefix
expiresAt
lastUsedAt
createdAt
revokedAt
```

A subscription:

```text
id
userId
provider
providerSubscriptionId
plan
status
currentPeriodStart
currentPeriodEnd
createdAt
updatedAt
```

Adapt these fields to the latest Better Auth, PayPal, and Drizzle recommendations.

Do not blindly use this schema if the latest documentation recommends a better design.

---

# PROJECT STRUCTURE

Use a clean maintainable structure.

Separate:

```text
UI
API
authentication
authorization
database
billing
API-key handling
validation
rate limiting
utilities
```

Do not put all business logic inside route handlers.

Create reusable server-side services/functions for:

- Authorization.
- Collection management.
- Record management.
- Plan/limit checking.
- API key authentication.
- Subscription synchronization.
- Validation.

---

# VALIDATION

Use a modern schema-validation library if needed, such as the currently recommended version of Zod.

Centralize reusable schemas for:

- Collection creation.
- Collection updates.
- Record creation.
- Record updates.
- API key creation.
- Pagination.
- Subscription-related requests.

Do not duplicate validation logic unnecessarily.

---

# TESTING

Create automated tests.

At minimum test:

## Authentication

- Registration.
- Login.
- Logout.
- Unauthorized access.

## Authorization

- User can access own collection.
- User cannot access another user's collection.
- User cannot modify another user's record.

## Free limits

- Can create collection 1–5.
- Cannot create collection 6.
- Can create records 1–50.
- Cannot create record 51.

## Pro

- Unlimited collections.
- Unlimited records within reasonable test constraints.

## API

- GET.
- POST.
- PUT.
- PATCH.
- DELETE.
- Pagination.
- Validation errors.
- Authentication errors.

## Billing

- Subscription activation.
- Subscription renewal.
- Cancellation.
- Expiration.
- Downgrade to Free.
- Webhook idempotency.

## Security

Test for:

- IDOR.
- Authorization bypass.
- Invalid API keys.
- Revoked API keys.
- Expired API keys.
- Excessive payloads.
- Invalid JSON.
- Rate limiting.

---

# SEED DATA

Create development seed data for public collections.

For example:

```text
Posts
Users
Comments
Products
Todos
```

Use realistic but fictional data.

Clearly separate:

```text
Development seed data
```

from production data.

Do not ship real personal information.

---

# API RESPONSE CONSISTENCY

Use a consistent response format.

Success:

```json
{
  "data": {}
}
```

Collection:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

Error:

```json
{
  "error": {
    "code": "SOME_ERROR",
    "message": "Human-readable error."
  }
}
```

Do not leak database errors directly to API consumers.

---

# HTTP CACHING

Public GET endpoints may use appropriate caching where safe.

Private responses must not accidentally become publicly cacheable.

Pay special attention to:

```text
Cache-Control
Vary
Authorization
```

and the current Next.js caching model.

---

# ENVIRONMENT CONFIGURATION

Provide:

```text
.env.example
```

and document all variables.

Separate development and production configuration.

PayPal should support:

```text
sandbox
production
```

without code changes.

---

# LOCAL DEVELOPMENT

Provide clear instructions for:

1. Installing dependencies.
2. Creating the PostgreSQL database.
3. Configuring environment variables.
4. Running Drizzle migrations.
5. Seeding the database.
6. Starting the development server.
7. Configuring PayPal sandbox.
8. Configuring Cloudinary.
9. Running tests.

---

# DEPLOYMENT

Design the application for production deployment.

Document:

- Environment variables.
- PostgreSQL requirements.
- Database migrations.
- PayPal webhook URL.
- Cloudinary configuration.
- HTTPS requirements.
- Secure cookies.
- Production security settings.

Do not assume that development settings are safe for production.

---

# IMPORTANT BUSINESS RULES

These rules are mandatory:

### Anonymous

```text
Public read-only resources
No private data
No private CRUD
No collection creation
```

### Free

```text
Authenticated
CRUD on own resources
Maximum 5 collections
Maximum 50 records per collection
```

### Pro

```text
Authenticated
CRUD on own resources
Unlimited collections
Unlimited records
Monthly PayPal subscription
```

### Expired Pro

```text
Automatically becomes Free
Never delete user data automatically
Apply Free restrictions to future usage
Clearly notify user
Allow manual re-subscription
```

---

# EDGE CASES

Handle these cases:

### User reaches collection limit

Show:

```text
You've reached the Free plan's 5-collection limit.
Upgrade to Pro for unlimited collections.
```

### User reaches record limit

Show:

```text
This collection has reached the Free plan's 50-record limit.
Upgrade to Pro for unlimited records.
```

### Pro subscription expires

Show:

```text
Your Pro subscription is no longer active.
Your existing data is safe, but Free plan limits now apply.
```

### User tries to access another user's collection

Return an appropriate authorization/not-found response without revealing whether the resource exists.

### Invalid API key

Return:

```http
401 Unauthorized
```

Do not reveal whether the key exists, is revoked, or belongs to another user beyond what is necessary.

### Revoked API key

Reject immediately.

### Expired API key

Reject immediately.

### Deleted collection

All associated records should no longer be accessible.

### Concurrent requests

Prevent race conditions around plan limits and ownership.

---

# API SECURITY MODEL

Clearly separate:

## Browser authentication

Use Better Auth sessions for the web application.

## Programmatic authentication

Use API keys for external API clients.

Do not expose session cookies as the recommended API authentication mechanism.

For API-key requests:

```http
Authorization: Bearer API_KEY
```

Authenticate and authorize the request server-side.

---

# NO SECURITY BY UI

Never assume that hiding a button prevents access.

For example, hiding:

```text
Create Collection
```

for a Free user who already has 5 collections is useful UX, but the API must ALSO reject:

```http
POST /api/collections
```

when the limit has been reached.

The backend is always authoritative.

---

# DEVELOPMENT WORKFLOW

Follow this workflow:

## Phase 1 — Research

Before coding:

1. Check current Next.js documentation.
2. Check current Tailwind CSS documentation.
3. Check Better Auth documentation.
4. Check Drizzle documentation.
5. Check PostgreSQL documentation.
6. Check Cloudinary documentation.
7. Check PayPal subscription/webhook documentation.
8. Identify current stable versions.
9. Identify deprecated APIs.
10. Document important implementation decisions.

## Phase 2 — Architecture

Design:

- Application structure.
- Database schema.
- Authentication architecture.
- Authorization architecture.
- API architecture.
- Subscription architecture.
- API-key architecture.
- Rate limiting strategy.

## Phase 3 — Foundation

Implement:

- Next.js project.
- Tailwind.
- PostgreSQL.
- Drizzle.
- Better Auth.
- Base layout.
- Environment configuration.

## Phase 4 — Public API

Implement:

- Public collections.
- Public GET endpoints.
- Seed data.
- API documentation.

## Phase 5 — Private CRUD

Implement:

- Collections.
- Records.
- Ownership checks.
- CRUD endpoints.
- Pagination.
- Validation.
- Free limits.

## Phase 6 — API Keys

Implement:

- Creation.
- Hashing.
- Authentication.
- Revocation.
- Expiration.
- Last-used tracking.

## Phase 7 — Dashboard

Implement:

- Dashboard.
- Collections UI.
- Record editor.
- API playground.
- Documentation.

## Phase 8 — Billing

Implement:

- Pricing.
- PayPal subscriptions.
- Webhooks.
- Subscription state synchronization.
- Pro access.
- Automatic downgrade.

## Phase 9 — Security

Perform a dedicated security review.

Look for:

- IDOR.
- Broken authorization.
- Authentication weaknesses.
- Injection.
- XSS.
- CSRF.
- Rate-limit bypass.
- Subscription privilege escalation.
- API-key leaks.
- Cache leaks.

## Phase 10 — Testing

Write and execute automated tests.

## Phase 11 — Production Readiness

Verify:

- Environment configuration.
- Database migrations.
- Error handling.
- Logging.
- Security headers.
- HTTPS behavior.
- PayPal webhooks.
- Cloudinary.
- Performance.
- Mobile UI.

---

# CODING STANDARDS

Use:

- TypeScript strict mode.
- Clear naming.
- Small reusable functions.
- Strong typing.
- Server-side validation.
- Minimal duplication.
- Meaningful error codes.
- Maintainable architecture.

Avoid:

- `any` unless genuinely unavoidable.
- Massive route handlers.
- Business logic inside UI components.
- Client-side authorization.
- Hardcoded secrets.
- Hardcoded subscription status.
- Trusting client-provided plan information.
- Unnecessary dependencies.
- Deprecated APIs.

---

# FINAL ACCEPTANCE CRITERIA

The application is complete only when all of the following are true:

- Anonymous users can read public resources.
- Anonymous users cannot modify public resources.
- Users can register and log in.
- Free users can create up to 5 collections.
- Free users cannot create a 6th collection.
- Free collections allow up to 50 records.
- Free users cannot create record 51.
- Users can perform CRUD operations on their own resources.
- Users cannot access another user's private resources.
- Pro users can create unlimited collections.
- Pro users can create unlimited records.
- Pro subscriptions are monthly.
- PayPal handles subscription billing.
- PayPal webhooks synchronize subscription state.
- Expired/cancelled Pro accounts downgrade to Free.
- Downgrade does not delete user data.
- API keys are securely generated and stored.
- Revoked/expired API keys cannot access the API.
- Public API endpoints work without authentication.
- Private API endpoints require authentication.
- Pagination is implemented.
- Rate limiting is implemented.
- Request validation is implemented.
- Security headers are configured appropriately.
- Sensitive secrets are never exposed.
- API responses use a consistent structure.
- API documentation exists.
- Interactive API playground exists.
- The UI is mobile responsive.
- Accessibility has been considered.
- Automated tests cover critical business/security rules.
- Production deployment configuration is documented.

---

# IMPORTANT IMPLEMENTATION PRINCIPLE

Build this as a real SaaS product, not as a demo.

The most important priorities are:

1. Security
2. Correct authorization
3. Correct subscription/plan enforcement
4. Data isolation between users
5. Reliable API behavior
6. Good developer experience
7. Mobile usability
8. Maintainability
9. Performance
10. Visual polish

When there is a conflict between convenience and security, choose security.

When there is a conflict between frontend behavior and backend enforcement, the backend must always be authoritative.

Before using any framework/library API, verify its current official documentation online.

Do not declare the project complete merely because the UI works. Verify the actual API, database, authorization, subscription lifecycle, security controls, and tests end-to-end.

note: push to repository time to time at https://github.com/jp26198926/testapi.git

env:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/testapi

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

ADMIN_EMAIL=

# SMTP (for contact form emails)

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_FROM_NAME=
SMTP_SECURE=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

NEXT_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
NEXT_PUBLIC_PAYPAL_ENVIRONMENT=
