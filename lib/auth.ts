import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { siteSettings } from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      const rows = await db.select().from(siteSettings).limit(1);
      const appName = rows[0]?.appName ?? "TESTAPI";
      void sendEmail({
        to: user.email,
        subject: `Reset your password - ${appName}`,
        html: `<p>Hi ${user.name || "there"},</p><p>Click the link below to reset your ${appName} password:</p><p><a href="${url}">Reset Password</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
      });
    },
    revokeSessionsOnPasswordReset: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [nextCookies()],
});
