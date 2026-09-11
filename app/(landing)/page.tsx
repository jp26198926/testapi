import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold">TESTAPI</span>
          <div className="flex items-center gap-4">
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
          <div className="text-left">
            <h3 className="font-semibold">Public API</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Access predefined collections without authentication. Great for
              testing and learning.
            </p>
          </div>
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
        <div className="mt-24 grid max-w-3xl gap-8 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 p-8 text-left dark:border-zinc-800">
            <h3 className="text-lg font-bold">Free</h3>
            <p className="mt-2 text-3xl font-bold">$0/mo</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>Public API access</li>
              <li>5 private collections</li>
              <li>50 records per collection</li>
              <li>CRUD API</li>
              <li>API playground</li>
              <li>API keys</li>
            </ul>
            <Link
              href="/register"
              className="mt-6 inline-block rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Get started
            </Link>
          </div>
          <div className="rounded-lg border border-black p-8 text-left dark:border-white">
            <h3 className="text-lg font-bold">Pro</h3>
            <p className="mt-2 text-3xl font-bold">$9/mo</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>Everything in Free</li>
              <li>Unlimited collections</li>
              <li>Unlimited records</li>
              <li>Higher rate limits</li>
              <li>Priority features</li>
            </ul>
            <Link
              href="/register"
              className="mt-6 inline-block rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <p>&copy; {new Date().getFullYear()} TESTAPI. All rights reserved.</p>
      </footer>
    </div>
  );
}
