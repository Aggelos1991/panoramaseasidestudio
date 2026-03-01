/**
 * In-memory sliding-window rate limiter.
 *
 * Works for single-instance deployments (Docker with one Next.js container).
 * For multi-instance, swap the Map for Redis.
 */

type RateLimitEntry = {
  timestamps: number[];
};

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

type RateLimitConfig = {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
};

type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetMs: number;
};

/**
 * Create a rate limiter for a specific endpoint.
 *
 * Usage:
 *   const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });
 *
 *   export async function POST(req: NextRequest) {
 *     const { success, remaining, resetMs } = limiter(getClientIp(req));
 *     if (!success) return rateLimitResponse(remaining, resetMs);
 *     ...
 *   }
 */
export function createRateLimiter(config: RateLimitConfig) {
  return function check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    cleanup(config.windowMs);

    let entry = store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      store.set(key, entry);
    }

    // Drop timestamps outside the window
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

    if (entry.timestamps.length >= config.maxRequests) {
      const oldestInWindow = entry.timestamps[0];
      const resetMs = oldestInWindow + config.windowMs - now;
      return {
        success: false,
        remaining: 0,
        resetMs: Math.max(resetMs, 0),
      };
    }

    entry.timestamps.push(now);

    return {
      success: true,
      remaining: config.maxRequests - entry.timestamps.length,
      resetMs: config.windowMs,
    };
  };
}

/**
 * Extract client IP from Next.js request.
 * Respects X-Forwarded-For (set by Nginx reverse proxy).
 */
export function getClientIp(request: Request): string {
  const forwarded = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip") ?? "";
  return forwarded || realIp || "unknown";
}

/**
 * Standard 429 JSON response with Retry-After header.
 */
export function rateLimitResponse(resetMs: number) {
  const retryAfterSec = Math.ceil(resetMs / 1000);
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}
