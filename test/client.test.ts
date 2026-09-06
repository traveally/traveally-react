import { describe, it, expect, beforeEach } from "bun:test";
import { TraveallyClient, createTraveallyClient } from "../src/api/client";

describe("TraveallyClient SDK", () => {
  let client: TraveallyClient;

  beforeEach(() => {
    client = createTraveallyClient({
      baseUrl: "https://backend.traveally.com",
      domain: "traveally.com",
      organizationId: "org_test_123"
    });
  });

  describe("Initialization & Token Management", () => {
    it("initializes with default config and domain", () => {
      expect(client).toBeDefined();
      expect(client.packages).toBeDefined();
      expect(client.auth).toBeDefined();
      expect(client.forms).toBeDefined();
      expect(client.payments).toBeDefined();
      expect(client.collections).toBeDefined();
      expect(client.activities).toBeDefined();
      expect(client.blogs).toBeDefined();
      expect(client.reviews).toBeDefined();
    });

    it("handles auth token setting and retrieval", () => {
      expect(client.getAuthToken()).toBeNull();
      client.setAuthToken("jwt_test_token_abc");
      expect(client.getAuthToken()).toBe("jwt_test_token_abc");
      client.setAuthToken(null);
      expect(client.getAuthToken()).toBeNull();
    });
  });

  describe("API Subsystems", () => {
    it("exposes package catalog methods", () => {
      expect(typeof client.packages.getAll).toBe("function");
      expect(typeof client.packages.getBySlug).toBe("function");
      expect(typeof client.packages.getById).toBe("function");
      expect(typeof client.packages.getTranslations).toBe("function");
      expect(typeof client.packages.getPricing).toBe("function");
    });

    it("exposes collections and activities methods", () => {
      expect(typeof client.collections.getAll).toBe("function");
      expect(typeof client.collections.getBySlug).toBe("function");
      expect(typeof client.activities.getAll).toBe("function");
      expect(typeof client.activities.getBySlug).toBe("function");
    });

    it("exposes blogs and author methods", () => {
      expect(typeof client.blogs.getAll).toBe("function");
      expect(typeof client.blogs.getBySlug).toBe("function");
      expect(typeof client.blogs.getAuthors).toBe("function");
    });

    it("exposes reviews and ratings methods", () => {
      expect(typeof client.reviews.getAll).toBe("function");
      expect(typeof client.reviews.getByPackage).toBe("function");
      expect(typeof client.reviews.submit).toBe("function");
    });

    it("exposes form submission methods", () => {
      expect(typeof client.forms.submitLead).toBe("function");
      expect(typeof client.forms.submitInquiry).toBe("function");
    });

    it("exposes customer auth & profile methods", () => {
      expect(typeof client.auth.signUp).toBe("function");
      expect(typeof client.auth.login).toBe("function");
      expect(typeof client.auth.sendOtp).toBe("function");
      expect(typeof client.auth.verifyOtp).toBe("function");
      expect(typeof client.auth.getProfile).toBe("function");
      expect(typeof client.auth.updateProfile).toBe("function");
      expect(typeof client.auth.getBookings).toBe("function");
      expect(typeof client.auth.logout).toBe("function");
    });

    it("exposes payment checkout methods", () => {
      expect(typeof client.payments.createOrder).toBe("function");
      expect(typeof client.payments.verifyPayment).toBe("function");
    });

    it("exposes telemetry and event tracking", () => {
      expect(typeof client.analytics.trackEvent).toBe("function");
    });
  });
});
