"use client";

import { useSession } from "@/lib/auth-client";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="max-w-lg space-y-6">
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Account</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm text-zinc-500">Name</label>
              <p className="font-medium">{session?.user?.name || "—"}</p>
            </div>
            <div>
              <label className="text-sm text-zinc-500">Email</label>
              <p className="font-medium">{session?.user?.email || "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
