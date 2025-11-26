import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitConfig, RATE_LIMITS } from './rate-limit';

/**
 * Apply rate limiting to an API request
 * Returns null if within limits, or a 429 response if rate limited
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.default
): NextResponse | null {
  // Get identifier - prefer user ID from header, fallback to IP
  const userId = request.headers.get('x-user-id');
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';

  const identifier = userId || ip;

  const result = rateLimit(identifier, config);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig = RATE_LIMITS.default
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = checkRateLimit(request, config);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return handler(request);
  };
}
