import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, collections, records } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const SEED_USER_ID = "seed-public-user";

const PUBLIC_COLLECTIONS = [
  {
    name: "Posts",
    slug: "posts",
    description: "Sample blog posts",
    data: [
      { title: "Hello World", content: "This is the first post on our platform. Welcome aboard!", published: true, author: "Alice", tags: ["intro", "welcome"] },
      { title: "Getting Started with REST APIs", content: "REST APIs are the backbone of modern web applications. Learn the fundamentals here.", published: true, author: "Bob", tags: ["api", "tutorial"] },
      { title: "Understanding HTTP Methods", content: "GET, POST, PUT, PATCH, DELETE — each method serves a distinct purpose in RESTful design.", published: true, author: "Charlie", tags: ["http", "api"] },
      { title: "Authentication Best Practices", content: "Never store passwords in plaintext. Use bcrypt or argon2 for hashing.", published: true, author: "Alice", tags: ["security", "auth"] },
      { title: "Pagination Patterns", content: "Offset-based and cursor-based pagination each have tradeoffs. Choose wisely based on your dataset.", published: true, author: "Diana", tags: ["api", "performance"] },
      { title: "Rate Limiting Explained", content: "Protect your API from abuse with token bucket or sliding window rate limiters.", published: true, author: "Bob", tags: ["security", "api"] },
      { title: "JSON Web Tokens Deep Dive", content: "JWTs are stateless tokens that carry claims. Understand header, payload, and signature.", published: true, author: "Eve", tags: ["auth", "jwt"] },
      { title: "Database Indexing 101", content: "Proper indexing can speed up queries by orders of magnitude. Know when and how to index.", published: true, author: "Charlie", tags: ["database", "performance"] },
      { title: "CORS for Beginners", content: "Cross-Origin Resource Sharing controls which domains can access your API from the browser.", published: true, author: "Diana", tags: ["security", "web"] },
      { title: "Webhooks vs Polling", content: "Webhooks push data to you in real time. Polling repeatedly checks for updates. Prefer webhooks.", published: true, author: "Alice", tags: ["api", "architecture"] },
      { title: "Versioning Your API", content: "Use URL versioning (e.g. /api/v1/) or header-based versioning to evolve your API without breaking clients.", published: true, author: "Bob", tags: ["api", "best-practices"] },
      { title: "Error Handling in APIs", content: "Return consistent error objects with codes and human-readable messages. Never expose stack traces.", published: true, author: "Eve", tags: ["api", "errors"] },
      { title: "Introduction to PostgreSQL", content: "PostgreSQL is a powerful, open-source relational database with support for JSONB, arrays, and more.", published: true, author: "Charlie", tags: ["database", "postgres"] },
      { title: "TypeScript for Backend", content: "TypeScript adds type safety to Node.js backends, catching errors at compile time instead of runtime.", published: true, author: "Diana", tags: ["typescript", "backend"] },
      { title: "Docker for Developers", content: "Containerize your application with Docker for consistent environments across dev, staging, and production.", published: true, author: "Alice", tags: ["devops", "docker"] },
      { title: "CI/CD Pipeline Basics", content: "Automate testing and deployment with GitHub Actions, GitLab CI, or similar tools.", published: true, author: "Bob", tags: ["devops", "automation"] },
      { title: "GraphQL vs REST", content: "REST is resource-oriented; GraphQL lets clients request exactly the data they need. Both have merit.", published: true, author: "Eve", tags: ["api", "graphql"] },
      { title: "WebSocket Real-Time Communication", content: "Websockets enable bidirectional communication between client and server over a single TCP connection.", published: true, author: "Charlie", tags: ["websockets", "realtime"] },
      { title: "OAuth 2.0 Simplified", content: "OAuth 2.0 delegates authentication to identity providers like Google, GitHub, or your own auth server.", published: true, author: "Diana", tags: ["auth", "oauth"] },
      { title: "Serverless Architecture", content: "Functions-as-a-Service let you run code without managing servers. Pay only for what you use.", published: true, author: "Alice", tags: ["cloud", "serverless"] },
      { title: "Caching Strategies", content: "Use Redis or in-memory caches to reduce database load. Cache invalidation is the hard part.", published: true, author: "Bob", tags: ["performance", "caching"] },
      { title: "API Documentation with OpenAPI", content: "The OpenAPI spec (formerly Swagger) lets you describe, document, and generate clients for your API.", published: true, author: "Eve", tags: ["api", "docs"] },
      { title: "Testing Your API Endpoints", content: "Write integration tests that hit your real API routes. Mock external services but test your own logic.", published: true, author: "Charlie", tags: ["testing", "api"] },
      { title: "Monorepo vs Polyrepo", content: "Monorepos keep all code in one repo. Polyrepos separate concerns. Choose based on team size and coupling.", published: false, author: "Diana", tags: ["architecture"] },
      { title: "Draft: API Versioning Strategies", content: "This post explores URL-based, header-based, and query-param-based versioning in depth.", published: false, author: "Alice", tags: ["api", "draft"] },
      { title: "Deploying to Vercel", content: "Vercel offers zero-config deployments for Next.js apps with edge functions and serverless support.", published: true, author: "Bob", tags: ["deployment", "vercel"] },
      { title: "Environment Variables Guide", content: "Never commit secrets. Use .env files locally and platform-level secrets in production.", published: true, author: "Eve", tags: ["security", "config"] },
      { title: "Understanding Middleware", content: "Middleware runs before your route handler. Use it for auth, logging, rate limiting, and more.", published: true, author: "Charlie", tags: ["backend", "middleware"] },
      { title: "SQL Injection Prevention", content: "Always use parameterized queries or an ORM. Never concatenate user input into SQL strings.", published: true, author: "Diana", tags: ["security", "database"] },
      { title: "Building a SaaS from Scratch", content: "From authentication to billing, this series covers everything you need to launch a SaaS product.", published: true, author: "Alice", tags: ["saas", "tutorial"] },
    ],
  },
  {
    name: "Users",
    slug: "users",
    description: "Sample user profiles",
    data: [
      { name: "Alice Johnson", email: "alice@example.com", role: "admin", department: "Engineering", location: "San Francisco", active: true },
      { name: "Bob Smith", email: "bob@example.com", role: "developer", department: "Engineering", location: "New York", active: true },
      { name: "Charlie Brown", email: "charlie@example.com", role: "developer", department: "Engineering", location: "London", active: true },
      { name: "Diana Prince", email: "diana@example.com", role: "designer", department: "Design", location: "Paris", active: true },
      { name: "Eve Martinez", email: "eve@example.com", role: "developer", department: "Engineering", location: "Berlin", active: true },
      { name: "Frank Lee", email: "frank@example.com", role: "manager", department: "Product", location: "Toronto", active: true },
      { name: "Grace Kim", email: "grace@example.com", role: "developer", department: "Engineering", location: "Seoul", active: true },
      { name: "Henry Wilson", email: "henry@example.com", role: "analyst", department: "Data", location: "Chicago", active: true },
      { name: "Iris Chen", email: "iris@example.com", role: "designer", department: "Design", location: "Shanghai", active: true },
      { name: "Jack Davis", email: "jack@example.com", role: "developer", department: "Engineering", location: "Austin", active: true },
      { name: "Karen White", email: "karen@example.com", role: "qa", department: "Engineering", location: "Seattle", active: true },
      { name: "Leo Garcia", email: "leo@example.com", role: "developer", department: "Engineering", location: "Madrid", active: true },
      { name: "Mia Thompson", email: "mia@example.com", role: "manager", department: "Operations", location: "Sydney", active: true },
      { name: "Noah Anderson", email: "noah@example.com", role: "developer", department: "Engineering", location: "Stockholm", active: true },
      { name: "Olivia Taylor", email: "olivia@example.com", role: "designer", department: "Design", location: "Amsterdam", active: true },
      { name: "Paul Robinson", email: "paul@example.com", role: "devops", department: "Infrastructure", location: "Dublin", active: true },
      { name: "Quinn Foster", email: "quinn@example.com", role: "developer", department: "Engineering", location: "Portland", active: true },
      { name: "Rachel Adams", email: "rachel@example.com", role: "analyst", department: "Data", location: "Boston", active: true },
      { name: "Sam Mitchell", email: "sam@example.com", role: "developer", department: "Engineering", location: "Denver", active: true },
      { name: "Tina Nguyen", email: "tina@example.com", role: "qa", department: "Engineering", location: "Ho Chi Minh", active: true },
      { name: "Uma Patel", email: "uma@example.com", role: "developer", department: "Engineering", location: "Bangalore", active: true },
      { name: "Victor Russo", email: "victor@example.com", role: "manager", department: "Sales", location: "Milan", active: true },
      { name: "Wendy Clark", email: "wendy@example.com", role: "designer", department: "Design", location: "Los Angeles", active: true },
      { name: "Xavier Jones", email: "xavier@example.com", role: "developer", department: "Engineering", location: "Atlanta", active: false },
      { name: "Yuki Tanaka", email: "yuki@example.com", role: "developer", department: "Engineering", location: "Tokyo", active: true },
      { name: "Zara Ahmed", email: "zara@example.com", role: "analyst", department: "Data", location: "Lahore", active: true },
      { name: "Aaron Cooper", email: "aaron@example.com", role: "devops", department: "Infrastructure", location: "Vancouver", active: true },
      { name: "Bella Rivera", email: "bella@example.com", role: "developer", department: "Engineering", location: "Miami", active: true },
      { name: "Chris Morgan", email: "chris@example.com", role: "manager", department: "Engineering", location: "London", active: true },
      { name: "Derek Singh", email: "derek@example.com", role: "developer", department: "Engineering", location: "Singapore", active: true },
    ],
  },
  {
    name: "Comments",
    slug: "comments",
    description: "Sample comments",
    data: [
      { postId: 1, author: "Bob", body: "Great first post! Looking forward to more content.", rating: 5 },
      { postId: 1, author: "Charlie", body: "Welcome to the platform!", rating: 4 },
      { postId: 2, author: "Alice", body: "This really helped me understand REST. Thanks!", rating: 5 },
      { postId: 2, author: "Diana", body: "Could you add more examples with cURL?", rating: 4 },
      { postId: 3, author: "Eve", body: "The PUT vs PATCH distinction was exactly what I needed.", rating: 5 },
      { postId: 3, author: "Frank", body: "I always mix up PUT and PATCH. This cleared it up.", rating: 5 },
      { postId: 4, author: "Grace", body: "Important topic. Too many apps still store plaintext passwords.", rating: 5 },
      { postId: 4, author: "Henry", body: "Would love to see a follow-up on MFA.", rating: 4 },
      { postId: 5, author: "Iris", body: "Cursor-based pagination was new to me. Great explanation.", rating: 4 },
      { postId: 5, author: "Jack", body: "We switched to cursor pagination and our performance improved 10x.", rating: 5 },
      { postId: 6, author: "Karen", body: "Rate limiting saved our API from a DDoS last week.", rating: 5 },
      { postId: 6, author: "Leo", body: "Token bucket is my favorite algorithm for this.", rating: 4 },
      { postId: 7, author: "Mia", body: "JWTs can be tricky — don't forget to verify the signature!", rating: 5 },
      { postId: 7, author: "Noah", body: "What about refresh token rotation?", rating: 4 },
      { postId: 8, author: "Olivia", body: "Adding a composite index cut our query time from 2s to 15ms.", rating: 5 },
      { postId: 8, author: "Paul", body: "EXPLAIN ANALYZE is your best friend.", rating: 5 },
      { postId: 9, author: "Quinn", body: "CORS errors are the bane of every frontend dev.", rating: 4 },
      { postId: 9, author: "Rachel", body: "The preflight request explanation was spot on.", rating: 5 },
      { postId: 10, author: "Sam", body: "We migrated from polling to webhooks and reduced our server load by 60%.", rating: 5 },
      { postId: 10, author: "Tina", body: "Make sure to implement idempotency for webhook handlers!", rating: 5 },
      { postId: 11, author: "Uma", body: "URL versioning is simple and works well for most APIs.", rating: 4 },
      { postId: 12, author: "Victor", body: "Consistent error formats make debugging so much easier.", rating: 5 },
      { postId: 13, author: "Wendy", body: "PostgreSQL's JSONB support is underrated.", rating: 5 },
      { postId: 14, author: "Xavier", body: "TypeScript caught 3 bugs in our API before they hit production.", rating: 5 },
      { postId: 15, author: "Yuki", body: "Docker Compose makes local dev with databases trivial.", rating: 4 },
      { postId: 16, author: "Zara", body: "GitHub Actions is free for public repos and very powerful.", rating: 4 },
      { postId: 17, author: "Aaron", body: "GraphQL has a steeper learning curve but pays off for complex apps.", rating: 4 },
      { postId: 18, author: "Bella", body: "Socket.io makes WebSockets much easier to work with.", rating: 4 },
      { postId: 19, author: "Chris", body: "OAuth flows can be confusing — PKCE is the way to go for SPAs.", rating: 5 },
      { postId: 20, author: "Derek", body: "Cold starts in serverless are less of a problem now than they used to be.", rating: 4 },
      { postId: 21, author: "Bob", body: "Redis with TTL is a great combo for session caching.", rating: 5 },
      { postId: 22, author: "Alice", body: "Auto-generated docs from OpenAPI spec saved us weeks of work.", rating: 5 },
      { postId: 23, author: "Charlie", body: "Integration tests caught a bug that unit tests missed.", rating: 5 },
      { postId: 26, author: "Diana", body: "Vercel's preview deployments are a game changer for PR reviews.", rating: 5 },
      { postId: 27, author: "Eve", body: "Use dotenv-safe to ensure all required env vars are set.", rating: 4 },
      { postId: 28, author: "Frank", body: "Logging middleware with request IDs makes debugging production issues much easier.", rating: 5 },
      { postId: 29, author: "Grace", body: "Parameterized queries should be non-negotiable. No excuses.", rating: 5 },
      { postId: 30, author: "Henry", body: "This SaaS series is exactly what I was looking for. Subscribed!", rating: 5 },
    ],
  },
  {
    name: "Products",
    slug: "products",
    description: "Sample product catalog",
    data: [
      { name: "Wireless Mouse M1", price: 29.99, currency: "USD", inStock: true, category: "peripherals", brand: "LogiTech", rating: 4.5, reviews: 230 },
      { name: "Mechanical Keyboard K1", price: 89.99, currency: "USD", inStock: true, category: "peripherals", brand: "KeyChron", rating: 4.8, reviews: 150 },
      { name: "USB-C Hub 7-in-1", price: 49.99, currency: "USD", inStock: true, category: "accessories", brand: "Anker", rating: 4.6, reviews: 310 },
      { name: 'Monitor 27" 4K', price: 399.99, currency: "USD", inStock: true, category: "displays", brand: "Dell", rating: 4.7, reviews: 89 },
      { name: "Webcam HD 1080p", price: 59.99, currency: "USD", inStock: true, category: "peripherals", brand: "LogiTech", rating: 4.3, reviews: 420 },
      { name: "Noise Cancelling Headphones", price: 249.99, currency: "USD", inStock: true, category: "audio", brand: "Sony", rating: 4.9, reviews: 560 },
      { name: "Laptop Stand Aluminum", price: 39.99, currency: "USD", inStock: true, category: "accessories", brand: "Rain", rating: 4.4, reviews: 180 },
      { name: "External SSD 1TB", price: 79.99, currency: "USD", inStock: true, category: "storage", brand: "Samsung", rating: 4.7, reviews: 290 },
      { name: "Desk Lamp LED", price: 34.99, currency: "USD", inStock: true, category: "office", brand: "BenQ", rating: 4.5, reviews: 110 },
      { name: "Ergonomic Chair Pro", price: 499.99, currency: "USD", inStock: false, category: "furniture", brand: "HermanMiller", rating: 4.8, reviews: 75 },
      { name: "Cable Management Kit", price: 14.99, currency: "USD", inStock: true, category: "accessories", brand: "Joto", rating: 4.2, reviews: 340 },
      { name: "Portable Charger 20000mAh", price: 29.99, currency: "USD", inStock: true, category: "accessories", brand: "Anker", rating: 4.6, reviews: 480 },
      { name: "Wireless Earbuds", price: 79.99, currency: "USD", inStock: true, category: "audio", brand: "Apple", rating: 4.5, reviews: 890 },
      { name: "Smart Speaker Mini", price: 49.99, currency: "USD", inStock: true, category: "smart-home", brand: "Amazon", rating: 4.3, reviews: 620 },
      { name: "Graphics Tablet S", price: 69.99, currency: "USD", inStock: true, category: "peripherals", brand: "Wacom", rating: 4.6, reviews: 95 },
      { name: "Standing Desk Converter", price: 199.99, currency: "USD", inStock: true, category: "furniture", brand: "FlexiSpot", rating: 4.4, reviews: 130 },
      { name: "Surge Protector 12-Outlet", price: 24.99, currency: "USD", inStock: true, category: "office", brand: "Belkin", rating: 4.7, reviews: 210 },
      { name: "Microphone USB Condenser", price: 119.99, currency: "USD", inStock: true, category: "audio", brand: "Blue", rating: 4.8, reviews: 160 },
      { name: "Ring Light 10-inch", price: 19.99, currency: "USD", inStock: false, category: "accessories", brand: "Neewer", rating: 4.1, reviews: 270 },
      { name: "Docking Station Thunderbolt", price: 179.99, currency: "USD", inStock: true, category: "accessories", brand: "CalDigit", rating: 4.7, reviews: 65 },
      { name: "Privacy Screen Protector", price: 34.99, currency: "USD", inStock: true, category: "accessories", brand: "3M", rating: 4.3, reviews: 90 },
      { name: "Wireless Charging Pad", price: 19.99, currency: "USD", inStock: true, category: "accessories", brand: "Samsung", rating: 4.2, reviews: 350 },
      { name: "KVM Switch 2-Port", price: 39.99, currency: "USD", inStock: true, category: "accessories", brand: "TESmart", rating: 4.4, reviews: 55 },
      { name: "Footrest Adjustable", price: 29.99, currency: "USD", inStock: true, category: "furniture", brand: "Humanscale", rating: 4.5, reviews: 80 },
      { name: "Webcam Light Bar", price: 44.99, currency: "USD", inStock: true, category: "accessories", brand: "BenQ", rating: 4.6, reviews: 45 },
      { name: "Bluetooth Tracker", price: 24.99, currency: "USD", inStock: true, category: "accessories", brand: "Tile", rating: 4.1, reviews: 510 },
      { name: "Monitor Arm Single", price: 29.99, currency: "USD", inStock: true, category: "furniture", brand: "Ergotron", rating: 4.7, reviews: 140 },
      { name: "Noise Machine White", price: 39.99, currency: "USD", inStock: true, category: "office", brand: "LectroFan", rating: 4.5, reviews: 200 },
      { name: "Smart Power Strip WiFi", price: 24.99, currency: "USD", inStock: true, category: "smart-home", brand: "Kasa", rating: 4.4, reviews: 170 },
      { name: "Desk Organizer Wood", price: 22.99, currency: "USD", inStock: true, category: "office", brand: "U Brands", rating: 4.3, reviews: 95 },
    ],
  },
  {
    name: "Todos",
    slug: "todos",
    description: "Sample todo items",
    data: [
      { task: "Set up development environment", completed: true, priority: "high", assignee: "Alice", dueDate: "2025-01-15" },
      { task: "Design database schema", completed: true, priority: "high", assignee: "Bob", dueDate: "2025-01-20" },
      { task: "Implement authentication", completed: true, priority: "high", assignee: "Charlie", dueDate: "2025-01-25" },
      { task: "Create API routes for collections", completed: true, priority: "high", assignee: "Diana", dueDate: "2025-02-01" },
      { task: "Create API routes for records", completed: true, priority: "high", assignee: "Eve", dueDate: "2025-02-01" },
      { task: "Add pagination support", completed: true, priority: "medium", assignee: "Alice", dueDate: "2025-02-05" },
      { task: "Implement rate limiting", completed: true, priority: "high", assignee: "Bob", dueDate: "2025-02-10" },
      { task: "Build public API endpoints", completed: true, priority: "medium", assignee: "Charlie", dueDate: "2025-02-12" },
      { task: "Add input validation with Zod", completed: true, priority: "high", assignee: "Diana", dueDate: "2025-02-15" },
      { task: "Create landing page", completed: true, priority: "medium", assignee: "Eve", dueDate: "2025-02-18" },
      { task: "Build dashboard UI", completed: true, priority: "medium", assignee: "Alice", dueDate: "2025-02-20" },
      { task: "Implement API key management", completed: true, priority: "high", assignee: "Bob", dueDate: "2025-02-22" },
      { task: "Create interactive API playground", completed: true, priority: "medium", assignee: "Charlie", dueDate: "2025-02-25" },
      { task: "Write API documentation page", completed: true, priority: "medium", assignee: "Diana", dueDate: "2025-02-28" },
      { task: "Implement PayPal subscriptions", completed: true, priority: "high", assignee: "Eve", dueDate: "2025-03-01" },
      { task: "Add webhook handling for PayPal", completed: true, priority: "high", assignee: "Alice", dueDate: "2025-03-05" },
      { task: "Implement plan limits (Free vs Pro)", completed: true, priority: "high", assignee: "Bob", dueDate: "2025-03-08" },
      { task: "Add security headers", completed: true, priority: "medium", assignee: "Charlie", dueDate: "2025-03-10" },
      { task: "Seed public collections with sample data", completed: true, priority: "low", assignee: "Diana", dueDate: "2025-03-12" },
      { task: "Write unit tests for utilities", completed: true, priority: "medium", assignee: "Eve", dueDate: "2025-03-15" },
      { task: "Write integration tests for API", completed: false, priority: "high", assignee: "Alice", dueDate: "2025-03-20" },
      { task: "Perform security audit", completed: false, priority: "high", assignee: "Bob", dueDate: "2025-03-25" },
      { task: "Set up CI/CD pipeline", completed: false, priority: "medium", assignee: "Charlie", dueDate: "2025-03-28" },
      { task: "Configure production deployment", completed: false, priority: "high", assignee: "Diana", dueDate: "2025-04-01" },
      { task: "Add email notifications", completed: false, priority: "low", assignee: "Eve", dueDate: "2025-04-10" },
      { task: "Implement admin dashboard", completed: false, priority: "low", assignee: "Alice", dueDate: "2025-04-15" },
      { task: "Add file upload with Cloudinary", completed: false, priority: "low", assignee: "Bob", dueDate: "2025-04-20" },
      { task: "Performance optimization pass", completed: false, priority: "medium", assignee: "Charlie", dueDate: "2025-04-25" },
      { task: "Mobile responsiveness audit", completed: false, priority: "medium", assignee: "Diana", dueDate: "2025-04-30" },
      { task: "Accessibility audit and fixes", completed: false, priority: "medium", assignee: "Eve", dueDate: "2025-05-05" },
    ],
  },
];

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("Seeding public collections...");

  // Ensure seed user exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.id, SEED_USER_ID))
    .limit(1);

  if (existingUser.length === 0) {
    await db.insert(users).values({
      id: SEED_USER_ID,
      name: "Seed Admin",
      email: "seed@testapi.local",
      emailVerified: true,
    });
    console.log("  Created seed user.");
  }

  for (const col of PUBLIC_COLLECTIONS) {
    // Check if collection already exists
    const existing = await db
      .select()
      .from(collections)
      .where(eq(collections.slug, col.slug))
      .limit(1);

    let collectionId: number;

    if (existing.length > 0) {
      collectionId = existing[0].id;
      console.log(`  Collection "${col.name}" already exists, skipping.`);
    } else {
      const [newCol] = await db
        .insert(collections)
        .values({
          userId: SEED_USER_ID,
          name: col.name,
          slug: col.slug,
          description: col.description,
          isPublic: true,
        })
        .returning();
      collectionId = newCol.id;
      console.log(`  Created collection: ${col.name}`);
    }

    // Check if records exist
    const existingRecords = await db
      .select()
      .from(records)
      .where(eq(records.collectionId, collectionId))
      .limit(1);

    if (existingRecords.length === 0) {
      for (const item of col.data) {
        await db.insert(records).values({
          collectionId,
          data: item,
        });
      }
      console.log(`    Added ${col.data.length} records.`);
    } else {
      console.log(`    Records already exist, skipping.`);
    }
  }

  console.log("Seed complete.");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
