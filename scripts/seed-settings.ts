import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { siteSettings, plans } from "../lib/db/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  // Seed site settings (upsert single row)
  const existing = await db.select().from(siteSettings).limit(1);
  if (existing.length === 0) {
    await db.insert(siteSettings).values({
      appName: "TESTAPI",
    });
    console.log("✓ Seeded site_settings");
  } else {
    console.log("• site_settings already exists, skipping");
  }

  // Seed default plans
  const existingPlans = await db.select().from(plans).limit(1);
  if (existingPlans.length === 0) {
    await db.insert(plans).values([
      {
        name: "Free",
        price: "$0/mo",
        features: [
          "Public API access",
          "5 private collections",
          "50 records per collection",
          "CRUD API",
          "API playground",
          "API keys",
        ],
        isActive: true,
        sortOrder: 0,
      },
      {
        name: "Pro",
        price: "$9/mo",
        features: [
          "Everything in Free",
          "Unlimited collections",
          "Unlimited records",
          "Higher rate limits",
          "Priority features",
        ],
        isActive: true,
        sortOrder: 1,
      },
    ]);
    console.log("✓ Seeded plans");
  } else {
    console.log("• plans already exist, skipping");
  }

  await pool.end();
  console.log("Done.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
