import { describe, it, expect } from "bun:test";
import {
  generateSecureSessionId,
  sanitizeMessageContent,
  isSafeUrl,
  ClientRateLimiter
} from "../src/chatbot/security";

describe("Chatbot Security & Utilities", () => {
  describe("generateSecureSessionId", () => {
    it("generates a session ID with tvl_sess_ prefix", () => {
      const id = generateSecureSessionId();
      expect(id).toBeString();
      expect(id.startsWith("tvl_sess_")).toBe(true);
      expect(id.length).toBeGreaterThan(16);
    });

    it("generates unique session IDs on multiple calls", () => {
      const id1 = generateSecureSessionId();
      const id2 = generateSecureSessionId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("sanitizeMessageContent", () => {
    it("returns empty string for null, undefined or empty input", () => {
      expect(sanitizeMessageContent("")).toBe("");
      expect(sanitizeMessageContent(null as any)).toBe("");
      expect(sanitizeMessageContent(undefined as any)).toBe("");
    });

    it("preserves safe plain text and travel itineraries", () => {
      const safeText = "Hello! I would like to book a 5-day trip to Bali with villa.";
      expect(sanitizeMessageContent(safeText)).toBe(safeText);
    });

    it("strips malicious <script> tags", () => {
      const malicious = "Hello <script>alert('xss')</script>world";
      expect(sanitizeMessageContent(malicious)).toBe("Hello world");
    });

    it("strips dangerous <iframe>, <style>, and <object> tags", () => {
      const malicious = "Text <iframe src='evil.com'></iframe><style>body{display:none}</style>";
      expect(sanitizeMessageContent(malicious)).toBe("Text ");
    });

    it("neutralizes dangerous event handlers like onerror and onload", () => {
      const malicious = '<img src="invalid.jpg" onerror="alert(1)">';
      const cleaned = sanitizeMessageContent(malicious);
      expect(cleaned.includes("onerror")).toBe(false);
    });

    it("neutralizes javascript: pseudo-protocols in links", () => {
      const malicious = '<a href="javascript:alert(1)">Click me</a>';
      const cleaned = sanitizeMessageContent(malicious);
      expect(cleaned.includes("javascript:")).toBe(false);
      expect(cleaned.includes('href="#"')).toBe(true);
    });

    it("truncates excessively long payloads to prevent buffer attacks", () => {
      const longInput = "a".repeat(5000);
      const cleaned = sanitizeMessageContent(longInput);
      expect(cleaned.length).toBeLessThanOrEqual(4000);
    });
  });

  describe("isSafeUrl", () => {
    it("allows valid https and http URLs", () => {
      expect(isSafeUrl("https://traveally.com")).toBe(true);
      expect(isSafeUrl("http://localhost:8000")).toBe(true);
      expect(isSafeUrl("https://backend.traveally.com/api")).toBe(true);
    });

    it("allows mailto: and tel: links", () => {
      expect(isSafeUrl("mailto:support@traveally.com")).toBe(true);
      expect(isSafeUrl("tel:+919876543210")).toBe(true);
    });

    it("rejects javascript:, vbscript:, and data: protocols", () => {
      expect(isSafeUrl("javascript:alert(1)")).toBe(false);
      expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
      expect(isSafeUrl("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")).toBe(false);
    });

    it("rejects invalid, malformed, or empty strings", () => {
      expect(isSafeUrl("")).toBe(false);
      expect(isSafeUrl("invalid://url")).toBe(false);
    });
  });

  describe("ClientRateLimiter", () => {
    it("allows requests up to the max limit within window", () => {
      const limiter = new ClientRateLimiter(3, 60000);
      expect(limiter.canProceed().allowed).toBe(true);
      expect(limiter.canProceed().allowed).toBe(true);
      expect(limiter.canProceed().allowed).toBe(true);
    });

    it("blocks requests once the max limit is exceeded and provides retryAfterSeconds", () => {
      const limiter = new ClientRateLimiter(2, 60000);
      expect(limiter.canProceed().allowed).toBe(true);
      expect(limiter.canProceed().allowed).toBe(true);
      const blocked = limiter.canProceed();
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("allows resetting the rate limiter", () => {
      const limiter = new ClientRateLimiter(1, 60000);
      expect(limiter.canProceed().allowed).toBe(true);
      expect(limiter.canProceed().allowed).toBe(false);
      limiter.reset();
      expect(limiter.canProceed().allowed).toBe(true);
    });
  });
});

