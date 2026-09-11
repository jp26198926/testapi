import Link from "next/link";
import { db } from "@/lib/db";
import { plans, siteSettings } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export default async function LandingPage() {
  const settingsRows = await db.select().from(siteSettings).limit(1);
  const settings = settingsRows[0] ?? { appName: "TESTAPI", logoUrl: null, faviconUrl: null };

  const activePlans = await db
    .select()
    .from(plans)
    .where(eq(plans.isActive, true))
    .orderBy(asc(plans.sortOrder));

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold">{settings.appName}</span>
          <div className="flex items-center gap-4">
            <Link
              href="/public-api"
              className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Public API
            </Link>
            <Link
              href="/docs"
              className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Docs
            </Link>
            <Link
              href="/login"
              className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
          Your API playground for learning and testing
        </h1>
        <p className="mt-6 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Create collections, manage records, and test CRUD operations with a
          real RESTful API. Free to start, Pro for unlimited.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/register"
            className="rounded-md bg-black px-6 py-3 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Start for free
          </Link>
          <Link
            href="/docs"
            className="rounded-md border border-zinc-300 px-6 py-3 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Read the docs
          </Link>
        </div>

        {/* Features */}
        <div className="mt-24 grid max-w-4xl gap-8 sm:grid-cols-3">
          <Link href="/public-api" className="group text-left">
            <h3 className="font-semibold group-hover:underline">
              Public API
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Access predefined collections without authentication. Great for
              testing and learning.
            </p>
            <span className="mt-2 inline-block text-sm text-black underline dark:text-white">
              Explore collections &rarr;
            </span>
          </Link>
          <div className="text-left">
            <h3 className="font-semibold">Private Collections</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Create your own collections with flexible JSON records. Full CRUD
              operations.
            </p>
          </div>
          <div className="text-left">
            <h3 className="font-semibold">API Playground</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Interactive playground to test API endpoints, view responses, and
              debug requests.
            </p>
          </div>
        </div>

        {/* Plans */}
        {activePlans.length > 0 && (
          <div
            className={`mt-24 grid max-w-3xl gap-8 ${
              activePlans.length === 1 ? "sm:grid-cols-1" : "sm:grid-cols-2"
            }`}
          >
            {activePlans.map((plan, i) => (
              <div
                key={plan.id}
                className={`rounded-lg p-8 text-left ${
                  i === activePlans.length - 1
                    ? "border border-black dark:border-white"
                    : "border border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mt-2 text-3xl font-bold">{plan.price}</p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {(plan.features as string[]).map((f, j) => (
                    <li key={j}>{f}</li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-6 inline-block rounded-md px-4 py-2 text-sm ${
                    i === activePlans.length - 1
                      ? "bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                      : "border border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                  }`}
                >
                  {i === activePlans.length - 1 ? "Upgrade" : "Get started"}
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <p>&copy; {new Date().getFullYear()} {settings.appName}. All rights reserved.</p>
      </footer>
    </div>
  );
}
