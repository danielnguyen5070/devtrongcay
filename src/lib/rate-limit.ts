import "server-only";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 20;
const MAX_TRACKED_KEYS = 5000;

const windows = new Map<string, { count: number; resetAt: number }>();

/**
 * Best-effort fixed-window limiter. State is per server instance, so it only
 * slows casual abuse; provider spend limits remain the hard cap.
 */
export function checkRateLimit(
  key: string,
  { max = MAX_REQUESTS, now = Date.now() }: { max?: number; now?: number } = {},
) {
  if (windows.size > MAX_TRACKED_KEYS) {
    for (const [entryKey, entry] of windows) {
      if (entry.resetAt <= now) windows.delete(entryKey);
    }
  }

  const entry = windows.get(key);
  if (!entry || entry.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= max) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clientKeyFromHeaders(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

export function clientKey(request: Request) {
  return clientKeyFromHeaders(request.headers);
}
