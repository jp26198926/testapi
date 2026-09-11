const buckets = new Map<string, { count: number; resetAt: number }>();

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  anonymous: { max: 60, windowMs: 60_000 },
  free: { max: 120, windowMs: 60_000 },
  pro: { max: 600, windowMs: 60_000 },
  auth: { max: 10, windowMs: 60_000 },
};

export function checkRateLimit(
  key: string,
  tier: keyof typeof LIMITS
): { allowed: boolean; remaining: number; resetAt: number } {
  const limit = LIMITS[tier];
  const now = Date.now();
  const bucketKey = `${tier}:${key}`;
  const bucket = buckets.get(bucketKey);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(bucketKey, { count: 1, resetAt: now + limit.windowMs });
    return { allowed: true, remaining: limit.max - 1, resetAt: now + limit.windowMs };
  }

  if (bucket.count >= limit.max) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count++;
  return { allowed: true, remaining: limit.max - bucket.count, resetAt: bucket.resetAt };
}

// Cleanup stale buckets periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(key);
    }
  }, 60_000);
}
