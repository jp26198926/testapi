import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiSuccessWithPagination<T>(
  data: T[],
  pagination: { page: number; limit: number; total: number; totalPages: number },
  status = 200
) {
  return NextResponse.json({ data, pagination }, { status });
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    { error: { code, message, ...extra } },
    { status }
  );
}

export const ERRORS = {
  UNAUTHORIZED: (msg = "Authentication required.") =>
    apiError("UNAUTHORIZED", msg, 401),
  FORBIDDEN: (msg = "You do not have access to this resource.") =>
    apiError("FORBIDDEN", msg, 403),
  NOT_FOUND: (msg = "Resource not found.") =>
    apiError("NOT_FOUND", msg, 404),
  COLLECTION_LIMIT_REACHED: () =>
    apiError(
      "COLLECTION_LIMIT_REACHED",
      "Free users can create a maximum of 5 collections.",
      403,
      { upgradeRequired: true }
    ),
  RECORD_LIMIT_REACHED: () =>
    apiError(
      "RECORD_LIMIT_REACHED",
      "You've reached the 50-record limit for the Free plan.",
      403,
      { upgradeRequired: true }
    ),
  RATE_LIMITED: () =>
    apiError("RATE_LIMITED", "Too many requests. Please try again later.", 429),
  BAD_REQUEST: (msg = "Invalid request.") =>
    apiError("BAD_REQUEST", msg, 400),
  CONFLICT: (msg = "Resource already exists.") =>
    apiError("CONFLICT", msg, 409),
  PAYLOAD_TOO_LARGE: (msg = "Request payload too large.") =>
    apiError("PAYLOAD_TOO_LARGE", msg, 413),
};
