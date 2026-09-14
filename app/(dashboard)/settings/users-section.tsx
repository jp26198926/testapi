"use client";

import { useState, useEffect } from "react";

type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  plan: "free" | "pro";
  collectionCount: number;
  isAdmin: boolean;
};

type AdminUserDetails = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  isAdmin: boolean;
  plan: "free" | "pro";
  collections: Array<{
    id: number;
    name: string;
    slug: string;
    isPublic: boolean;
    createdAt: string;
  }>;
  apiKeys: Array<{
    id: string;
    name: string;
    keyPrefix: string;
    expiresAt: string | null;
    lastUsedAt: string | null;
    revokedAt: string | null;
    createdAt: string;
  }>;
  subscriptions: Array<{
    id: string;
    provider: string;
    plan: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    createdAt: string;
  }>;
};

export default function UsersSection() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const usersLimit = 10;

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<AdminUserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [planChangingId, setPlanChangingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState("");
  const [sectionSuccess, setSectionSuccess] = useState("");

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersPage]);

  async function fetchUsers() {
    setUsersLoading(true);
    try {
      const res = await fetch(
        `/api/admin/users?page=${usersPage}&limit=${usersLimit}`
      );
      if (!res.ok) {
        const d = await res.json();
        setSectionError(d.error?.message || "Failed to load users.");
        return;
      }
      const d = await res.json();
      setUsers(d.data);
      setUsersTotalPages(d.pagination.totalPages);
      setUsersTotal(d.pagination.total);
    } catch {
      setSectionError("Failed to load users.");
    }
    setUsersLoading(false);
  }

  async function toggleUserDetails(userId: string) {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setUserDetails(null);
      return;
    }
    setExpandedUserId(userId);
    setUserDetails(null);
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const d = await res.json();
        setUserDetails(d.data);
      } else {
        const d = await res.json();
        setSectionError(d.error?.message || "Failed to load user details.");
        setExpandedUserId(null);
      }
    } catch {
      setSectionError("Failed to load user details.");
      setExpandedUserId(null);
    }
    setDetailsLoading(false);
  }

  async function handleChangePlan(userId: string, plan: "free" | "pro") {
    setPlanChangingId(userId);
    setSectionError("");
    setSectionSuccess("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (res.ok) {
        setSectionSuccess(`Plan set to ${plan}.`);
        await fetchUsers();
        if (expandedUserId === userId) {
          const d2 = await fetch(`/api/admin/users/${userId}`);
          if (d2.ok) setUserDetails((await d2.json()).data);
        }
      } else {
        const d = await res.json();
        setSectionError(d.error?.message || "Failed to change plan.");
      }
    } catch {
      setSectionError("Failed to change plan.");
    }
    setPlanChangingId(null);
  }

  async function handleDeleteUser(userId: string) {
    if (
      !confirm(
        "Delete this user and ALL their data (collections, records, API keys, subscription, payments)? This cannot be undone."
      )
    ) {
      return;
    }
    setDeletingId(userId);
    setSectionError("");
    setSectionSuccess("");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        setSectionSuccess("User deleted.");
        if (expandedUserId === userId) {
          setExpandedUserId(null);
          setUserDetails(null);
        }
        if (users.length === 1 && usersPage > 1) {
          setUsersPage(usersPage - 1);
        } else {
          await fetchUsers();
        }
      } else {
        const d = await res.json();
        setSectionError(d.error?.message || "Failed to delete user.");
      }
    } catch {
      setSectionError("Failed to delete user.");
    }
    setDeletingId(null);
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Users</h2>
        <p className="text-sm text-zinc-500">{usersTotal} total</p>
      </div>

      {sectionError && (
        <div className="mt-3 rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {sectionError}
        </div>
      )}
      {sectionSuccess && (
        <div className="mt-3 rounded bg-green-50 p-3 text-sm text-green-600 dark:bg-green-950 dark:text-green-400">
          {sectionSuccess}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {usersLoading && (
          <p className="text-sm text-zinc-500">Loading users...</p>
        )}
        {!usersLoading && users.length === 0 && (
          <p className="text-sm text-zinc-500">No users found.</p>
        )}

        {users.map((u) => (
          <div
            key={u.id}
            className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {u.name || "—"}
                  {u.isAdmin && (
                    <span className="ml-2 inline-block rounded bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-white dark:text-zinc-900">
                      Admin
                    </span>
                  )}
                </p>
                <p className="truncate text-sm text-zinc-500">{u.email}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {u.collectionCount} collection
                  {u.collectionCount === 1 ? "" : "s"} · joined{" "}
                  {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                    u.plan === "pro"
                      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {u.plan}
                </span>

                {!u.isAdmin && (
                  <>
                    {u.plan === "free" ? (
                      <button
                        onClick={() => handleChangePlan(u.id, "pro")}
                        disabled={planChangingId === u.id}
                        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        {planChangingId === u.id ? "..." : "Make Pro"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleChangePlan(u.id, "free")}
                        disabled={planChangingId === u.id}
                        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        {planChangingId === u.id ? "..." : "Make Free"}
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={() => toggleUserDetails(u.id)}
                  className="rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  {expandedUserId === u.id ? "Hide" : "Details"}
                </button>

                {!u.isAdmin && (
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    disabled={deletingId === u.id}
                    className="rounded px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950"
                  >
                    {deletingId === u.id ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
            </div>

            {expandedUserId === u.id && (
              <div className="mt-4 space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                {detailsLoading && (
                  <p className="text-sm text-zinc-500">Loading details...</p>
                )}
                {!detailsLoading && userDetails && userDetails.id === u.id && (
                  <>
                    <div>
                      <h4 className="text-sm font-semibold">
                        Collections ({userDetails.collections.length})
                      </h4>
                      {userDetails.collections.length === 0 ? (
                        <p className="mt-1 text-sm text-zinc-500">None</p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {userDetails.collections.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between rounded border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                            >
                              <span className="font-medium">{c.name}</span>
                              <span className="text-xs text-zinc-500">
                                /{c.slug}
                                {c.isPublic ? " · public" : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold">
                        API Keys ({userDetails.apiKeys.length})
                      </h4>
                      {userDetails.apiKeys.length === 0 ? (
                        <p className="mt-1 text-sm text-zinc-500">None</p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {userDetails.apiKeys.map((k) => (
                            <div
                              key={k.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                            >
                              <span className="font-medium">
                                {k.name}{" "}
                                <code className="text-xs text-zinc-500">
                                  {k.keyPrefix}…
                                </code>
                              </span>
                              <span className="flex items-center gap-2 text-xs text-zinc-500">
                                {k.revokedAt ? (
                                  <span className="inline-block rounded bg-red-100 px-2 py-0.5 font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                                    revoked
                                  </span>
                                ) : (
                                  <span className="inline-block rounded bg-green-100 px-2 py-0.5 font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                                    active
                                  </span>
                                )}
                                {k.lastUsedAt
                                  ? `last used ${new Date(k.lastUsedAt).toLocaleDateString()}`
                                  : "never used"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold">Subscription</h4>
                      <p className="mt-1 text-sm">
                        Effective plan:{" "}
                        <span className="inline-block rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
                          {userDetails.plan}
                        </span>
                      </p>
                      {userDetails.subscriptions.length === 0 ? (
                        <p className="mt-1 text-sm text-zinc-500">
                          No subscription records.
                        </p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {userDetails.subscriptions.map((s) => (
                            <div
                              key={s.id}
                              className="rounded border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                            >
                              <p>
                                <span className="font-medium">{s.plan}</span>
                                {" · "}
                                <span
                                  className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                                    s.status === "active"
                                      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                  }`}
                                >
                                  {s.status}
                                </span>
                                {" · "}
                                {s.provider}
                              </p>
                              {s.currentPeriodEnd && (
                                <p className="mt-1 text-xs text-zinc-500">
                                  Period ends{" "}
                                  {new Date(
                                    s.currentPeriodEnd
                                  ).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {usersTotalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
            disabled={usersPage <= 1}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700"
          >
            Prev
          </button>
          <span className="text-sm text-zinc-500">
            Page {usersPage} of {usersTotalPages}
          </span>
          <button
            onClick={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
            disabled={usersPage >= usersTotalPages}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
