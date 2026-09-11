"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/collections", label: "Collections" },
  { href: "/keys", label: "API Keys" },
  { href: "/playground", label: "Playground" },
  { href: "/docs", label: "Documentation" },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 md:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <Link href="/" className="text-lg font-bold">
              TESTAPI
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-md px-3 py-2 text-sm ${
                    isActive
                      ? "bg-zinc-200 font-medium dark:bg-zinc-800"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
            <div className="mb-2 text-xs text-zinc-500">
              {session?.user?.email}
            </div>
            <button
              onClick={async () => { await signOut(); window.location.href = "/"; }}
              className="w-full rounded-md px-3 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 md:hidden">
          <Link href="/" className="text-lg font-bold">
            TESTAPI
          </Link>
          <nav className="flex gap-3 overflow-x-auto text-sm">
            {NAV_ITEMS.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap ${
                  pathname === item.href
                    ? "font-medium"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
