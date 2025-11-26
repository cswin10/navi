/**
 * Simple in-memory rate limiter
 * For production, use Redis (e.g., Upstash) for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  limit: number;        // Max requests
  windowMs: number;     // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Check if a request is within rate limits
 * @param identifier - Unique identifier (e.g., user ID, IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  // Get or create entry
  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // Create new entry
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  // Increment count
  entry.count += 1;
  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, config.limit - entry.count);
  const success = entry.count <= config.limit;

  return {
    success,
    limit: config.limit,
    remaining,
    resetTime: entry.resetTime,
  };
}

// Preset configurations for different API routes
export const RATE_LIMITS = {
  // Voice processing - higher limit needed for interactive use
  voice: {
    limit: 60,          // 60 requests
    windowMs: 60 * 1000, // per minute
  },
  // Intent processing
  process: {
    limit: 60,
    windowMs: 60 * 1000,
  },
  // Action execution
  execute: {
    limit: 30,
    windowMs: 60 * 1000,
  },
  // TTS - can be expensive
  speak: {
    limit: 30,
    windowMs: 60 * 1000,
  },
  // Account operations
  account: {
    limit: 10,
    windowMs: 60 * 1000,
  },
  // Default
  default: {
    limit: 100,
    windowMs: 60 * 1000,
  },
};
