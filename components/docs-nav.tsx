"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export default function DocsNav() {
  const { data: session } = useSession();

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/public-api"
        className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
      >
        Public API
      </Link>
      <Link
        href="/public-docs"
        className="text-sm font-medium text-black dark:text-white"
      >
        Docs
      </Link>
      {session ? (
        <Link
          href="/dashboard"
          className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Dashboard
        </Link>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
