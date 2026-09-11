import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { collections, subscriptions } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { getUserPlan } from "@/lib/api/plans";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const userId = session.user.id;
  const plan = await getUserPlan(userId);

  const collCount = await db
    .select({ count: count() })
    .from(collections)
    .where(eq(collections.userId, userId));
  const totalCollections = collCount[0]?.count ?? 0;

  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Welcome back, {session.user.name}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Current Plan</p>
          <p className="mt-1 text-2xl font-bold capitalize">{plan}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Collections</p>
          <p className="mt-1 text-2xl font-bold">
            {totalCollections} {plan === "free" ? "/ 5" : ""}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Subscription</p>
          <p className="mt-1 text-2xl font-bold capitalize">
            {sub.length > 0 ? sub[0].status : "Free"}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Quick Actions</p>
          <div className="mt-2 flex gap-2">
            <Link
              href="/collections"
              className="rounded bg-black px-3 py-1 text-xs text-white dark:bg-white dark:text-black"
            >
              Collections
            </Link>
            <Link
              href="/keys"
              className="rounded border border-zinc-300 px-3 py-1 text-xs dark:border-zinc-700"
            >
              API Keys
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
