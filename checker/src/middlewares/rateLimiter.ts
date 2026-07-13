import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (c: Context) => string;
}) {
  const store: RateLimitStore = {};
  const { windowMs, max, message = "Too many requests, please try again later." } = options;
  const keyGen = options.keyGenerator || ((c) => {
    return c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown-ip";
  });

  // Cleanup store periodically to avoid memory leaks
  const intervalId = setInterval(() => {
    const now = Date.now();
    for (const key in store) {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    }
  }, windowMs * 2);

  // Unref the timer so it doesn't prevent the process from exiting in tests
  if (typeof intervalId.unref === "function") {
    intervalId.unref();
  }

  return async (c: Context, next: Next) => {
    const key = keyGen(c);
    const now = Date.now();
    
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    store[key].count++;

    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(Math.max(0, max - store[key].count)));
    c.header("X-RateLimit-Reset", String(Math.ceil(store[key].resetTime / 1000)));

    if (store[key].count > max) {
      throw new HTTPException(429, { message });
    }

    await next();
  };
}

// In-memory login rate limiter: 5 attempts per 15 minutes
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts from this IP, please try again after 15 minutes.",
  keyGenerator: (c) => `login-${c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown-ip"}`
});

// Global checker rate limiter: 60 requests per minute
export const checkerRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: "Too many proxy check requests from this IP, please try again after a minute.",
  keyGenerator: (c) => `checker-${c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown-ip"}`
});
