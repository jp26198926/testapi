import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";

export type SiteSettings = {
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
};

export const FALLBACK_SETTINGS: SiteSettings = {
  appName: "TESTAPI",
  logoUrl: null,
  faviconUrl: null,
};

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const rows = await db.select().from(siteSettings).limit(1);
    const row = rows[0];
    if (!row) return FALLBACK_SETTINGS;
    return {
      appName: row.appName,
      logoUrl: row.logoUrl,
      faviconUrl: row.faviconUrl,
    };
  },
  ["site-settings"],
  { tags: ["site-settings"], revalidate: 600 }
);
