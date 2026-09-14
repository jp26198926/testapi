import { getSiteSettings } from "@/lib/settings";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const { faviconUrl } = await getSiteSettings();
  if (!faviconUrl) return new Response(null, { status: 404 });

  const res = await fetch(faviconUrl);
  if (!res.ok) return new Response(null, { status: 404 });

  const body = await res.arrayBuffer();
  return new Response(body, {
    headers: {
      "Content-Type": res.headers.get("content-type") || "image/png",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
