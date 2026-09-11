import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { authenticateApiKey } from "./plans";
import type { Session, User } from "better-auth";

export type AuthResult = {
  user: User;
  method: "session" | "api-key";
};

export async function getSession(): Promise<{
  session: Session;
  user: User;
} | null> {
  const result = await auth.api.getSession({
    headers: await headers(),
  });
  return result as { session: Session; user: User } | null;
}

export async function getAuthUser(): Promise<AuthResult | null> {
  const h = await headers();

  // Try API key first
  const authHeader = h.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const key = authHeader.slice(7);
    const userId = await authenticateApiKey(key);
    if (userId) {
      // Fetch user details
      const { db } = await import("@/lib/db");
      const { users } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (user.length > 0) {
        return { user: user[0], method: "api-key" };
      }
    }
  }

  // Fall back to session
  const session = await getSession();
  if (session) {
    return {
      user: session.user,
      method: "session",
    };
  }

  return null;
}

export async function requireAuth(): Promise<AuthResult> {
  const result = await getAuthUser();
  if (!result) {
    throw new AuthError("Authentication required.", 401);
  }
  return result;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
