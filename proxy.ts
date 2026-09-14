import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
  "Access-Control-Max-Age": "86400",
};

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
    }
    const response = NextResponse.next();
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }
    return response;
  }

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/collections/:path*",
    "/keys/:path*",
    "/playground/:path*",
    "/billing/:path*",
    "/settings/:path*",
  ],
};
