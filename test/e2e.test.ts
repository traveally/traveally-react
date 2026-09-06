import { describe, it, expect } from "bun:test";
import { TraveallyClient } from "../src/api/client";
import { fetchOrganizationBranding, fetchChatbotConfig } from "../src/chatbot/api";

const BACKEND_URL = "https://backend.traveally.com";
const TEST_DOMAIN = "traveally.com";

describe("Live E2E Integration with backend.traveally.com", () => {
  const client = new TraveallyClient({
    baseUrl: BACKEND_URL,
    domain: TEST_DOMAIN
  });

  describe("Chatbot Backend Resolution", () => {
    it("successfully resolves verified organization branding from backend.traveally.com", async () => {
      const branding = await fetchOrganizationBranding(TEST_DOMAIN, BACKEND_URL);
      expect(branding).toBeDefined();
      expect(branding.name).toBeString();
      expect(branding.name.toLowerCase()).toContain("traveally");
      expect(branding.logo).toBeString();
      expect(branding.is_platform).toBe(true);
    });

    it("fetches live chatbot configuration & lead form policy", async () => {
      const config = await fetchChatbotConfig(TEST_DOMAIN, BACKEND_URL);
      // If deployed endpoint is live, validates payload structure
      if (config) {
        expect(config.domain).toBe(TEST_DOMAIN);
        expect(config.theme).toBeDefined();
        expect(config.form_fields).toBeArray();
      }
    });
  });

  describe("Public Website API Integration", () => {
    it("fetches live tour packages from backend.traveally.com", async () => {
      const packages = await client.packages.getAll();
      expect(packages).toBeArray();
      if (packages.length > 0) {
        const pkg = packages[0];
        expect(pkg.package_name).toBeString();
        expect(pkg.slug).toBeString();
        expect(pkg.price).toBeNumber();
      }
    });

    it("fetches live blog articles from backend.traveally.com", async () => {
      const blogs = await client.blogs.getAll();
      expect(blogs).toBeArray();
      if (blogs.length > 0) {
        const blog = blogs[0];
        expect(blog.title).toBeString();
        expect(blog.slug).toBeString();
      }
    });

    it("fetches collections from backend.traveally.com", async () => {
      const collections = await client.collections.getAll();
      expect(collections).toBeArray();
    });

    it("fetches verified reviews from backend.traveally.com", async () => {
      const reviews = await client.reviews.getAll();
      expect(reviews).toBeArray();
    });
  });
});
