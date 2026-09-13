"use client";

import { useState } from "react";
import Link from "next/link";

export default function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <div className="hidden items-center gap-4 md:flex">
        <Link
          href="/public-api"
          className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
        >
          Public API
        </Link>
        <Link
          href="/public-docs"
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

      {/* Mobile hamburger */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 md:hidden"
        aria-label="Toggle menu"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {menuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute left-0 right-0 top-full z-50 border-b border-zinc-200 bg-white px-6 py-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
          <div className="flex flex-col gap-3">
            <Link
              href="/public-api"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Public API
            </Link>
            <Link
              href="/public-docs"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Docs
            </Link>
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="rounded-md bg-black px-4 py-2 text-center text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
