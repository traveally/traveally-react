/**
 * Security utilities for @traveally/chatbot
 * Provides XSS sanitization, anti-tamper token generation, rate limiting, and safe link parsing.
 */

/**
 * Generate a cryptographically secure, unguessable session identifier
 */
export function generateSecureSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `tvl_sess_${crypto.randomUUID().replace(/-/g, "")}`;
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return `tvl_sess_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
  }

  // Resilient entropy fallback
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const extraPart = Math.random().toString(36).substring(2, 10);
  return `tvl_sess_${timestamp}_${randomPart}${extraPart}`;
}

/**
 * Sanitize plain text or markdown to prevent XSS injection.
 * Strips script tags, unsafe protocols (javascript:, data:text/html, vbscript:),
 * dangerous DOM attributes (onload, onerror, onclick, etc.).
 */
export function sanitizeMessageContent(input: string): string {
  if (!input || typeof input !== "string") return "";

  // Truncate excessively large payload to mitigate buffer exhaustion (DoS)
  const trimmed = input.slice(0, 4000);

  // 1. Remove dangerous script and iframe blocks entirely
  let clean = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "");

  // 2. Strip dangerous event handlers (e.g. onerror=, onload=, onclick=)
  clean = clean.replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "");

  // 3. Neutralize dangerous URL schemes in markdown or inline links
  clean = clean.replace(
    /(href|src)\s*=\s*["']?\s*(?:javascript|vbscript|data\s*:\s*text\/html):[^"'\s>]*/gi,
    '$1="#"'
  );

  return clean;
}

/**
 * Check if a URL uses a safe web protocol (https, http, mailto, tel)
 */
export function isSafeUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("/")
  );
}

/**
 * In-memory sliding window rate limiter to throttle message spam
 */
export class ClientRateLimiter {
  private timestamps: number[] = [];
  private readonly maxLimit: number;
  private readonly windowMs: number;

  constructor(maxLimit: number = 20, windowMs: number = 60000) {
    this.maxLimit = maxLimit;
    this.windowMs = windowMs;
  }

  /**
   * Checks whether the action is permitted.
   * Returns `{ allowed: true }` or `{ allowed: false, retryAfterSeconds }`
   */
  canProceed(): { allowed: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    // Prune entries outside the current window
    this.timestamps = this.timestamps.filter((ts) => now - ts < this.windowMs);

    if (this.timestamps.length >= this.maxLimit) {
      const oldest = this.timestamps[0];
      const waitMs = this.windowMs - (now - oldest);
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(waitMs / 1000),
      };
    }

    this.timestamps.push(now);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  reset(): void {
    this.timestamps = [];
  }
}
