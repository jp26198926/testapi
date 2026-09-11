import type { User } from "better-auth";
import { AuthError } from "./auth";

export function isAdmin(user: User): boolean {
  return user.email === process.env.ADMIN_EMAIL;
}

export function requireAdmin(user: User): void {
  if (!isAdmin(user)) {
    throw new AuthError("Admin access required.", 403);
  }
}
