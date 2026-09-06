import type {
  TraveallyApiConfig,
  ApiResponse,
  TravelPackage,
  TravelCollection,
  TravelActivity,
  BlogPost,
  CustomerReview,
  CustomerUser,
  AuthSessionResponse,
  BookingRecord,
  FormSubmissionPayload,
  PaymentOrderParams,
  PaymentVerifyParams
} from "./types";

/**
 * Traveally Client SDK
 * Production-ready public client providing unified methods for websites built on the Traveally platform.
 */
export class TraveallyClient {
  private baseUrl: string;
  private domain: string;
  private organizationId?: string;
  private token: string | null = null;
  private onTokenExpired?: () => void;

  constructor(config: TraveallyApiConfig = {}) {
    this.baseUrl = (config.baseUrl || "https://backend.traveally.com").replace(/\/+$/, "");
    this.domain = config.domain || (typeof window !== "undefined" ? window.location.hostname : "traveally.com");
    this.organizationId = config.organizationId;
    this.token = config.authToken || this.getStoredToken();
    this.onTokenExpired = config.onTokenExpired;
  }

  // ── Session & Header Management ─────────────────────────────
  public setAuthToken(token: string | null): void {
    this.token = token;
    if (typeof localStorage !== "undefined") {
      if (token) {
        localStorage.setItem("traveally_auth_token", token);
      } else {
        localStorage.removeItem("traveally_auth_token");
      }
    }
  }

  public getAuthToken(): string | null {
    return this.token;
  }

  private getStoredToken(): string | null {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("traveally_auth_token");
    }
    return null;
  }

  private buildHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-org-domain": this.domain,
      ...customHeaders
    };

    if (this.organizationId) {
      headers["x-organization-id"] = this.organizationId;
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const headers = this.buildHeaders((options.headers as Record<string, string>) || {});

    try {
      const res = await fetch(url, {
        ...options,
        headers
      });

      if (res.status === 401 && this.token) {
        this.setAuthToken(null);
        if (this.onTokenExpired) {
          this.onTokenExpired();
        }
      }

      const data = await res.json().catch(() => ({}));
      return data as ApiResponse<T>;
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "Network request failed"
      };
    }
  }

  // ── 1. Packages & Catalog API ──────────────────────────────
  public packages = {
    /**
     * Get all active tour packages for the current organization domain
     */
    getAll: async (): Promise<TravelPackage[]> => {
      const res = await this.request<{ packages: TravelPackage[] }>("/api/packages/all");
      return (res.packages || res.data || []) as TravelPackage[];
    },

    /**
     * Get package details by its URL slug or ID
     */
    getBySlug: async (slug: string): Promise<TravelPackage | null> => {
      const res = await this.request<{ package: TravelPackage }>(`/api/packages/slug/${encodeURIComponent(slug)}`);
      return res.package || (res.data as unknown as TravelPackage) || null;
    },

    /**
     * Get package by ID directly
     */
    getById: async (id: string): Promise<TravelPackage | null> => {
      const res = await this.request<{ package: TravelPackage }>(`/api/packages/${encodeURIComponent(id)}`);
      return res.package || (res.data as unknown as TravelPackage) || null;
    },


    /**
     * Get localized translations for a package
     */
    getTranslations: async (packageId: string) => {
      const res = await this.request(`/api/packages/${encodeURIComponent(packageId)}/translations`);
      return res.data || res.translations || [];
    },

    /**
     * Get tier pricing matrix for a package
     */
    getPricing: async (packageId: string) => {
      const res = await this.request(`/api/packages/${encodeURIComponent(packageId)}/pricing`);
      return res.data || res.pricing || [];
    }
  };

  // ── 2. Collections & Activities API ────────────────────────
  public collections = {
    /**
     * List all thematic collections (e.g. Honeymoon, Adventure, Weekend Trips)
     */
    getAll: async (): Promise<TravelCollection[]> => {
      const res = await this.request<{ collections: TravelCollection[] }>("/api/collections");
      return (res.collections || res.data || []) as TravelCollection[];
    },

    /**
     * Get collection by slug including member packages
     */
    getBySlug: async (slug: string): Promise<TravelCollection | null> => {
      const res = await this.request<{ collection: TravelCollection }>(`/api/collections/${encodeURIComponent(slug)}`);
      return res.collection || (res.data as unknown as TravelCollection) || null;
    }
  };

  public activities = {
    /**
     * Get all travel activities & excursions
     */
    getAll: async (): Promise<TravelActivity[]> => {
      const res = await this.request<{ activities: TravelActivity[] }>("/api/activities");
      return (res.activities || res.data || []) as TravelActivity[];
    },

    /**
     * Get single activity by slug
     */
    getBySlug: async (slug: string): Promise<TravelActivity | null> => {
      const res = await this.request<{ activity: TravelActivity }>(`/api/activities/${encodeURIComponent(slug)}`);
      return res.activity || (res.data as unknown as TravelActivity) || null;
    }
  };

  // ── 3. Blogs & Content API ─────────────────────────────────
  public blogs = {
    /**
     * List published destination guides & travel articles
     */
    getAll: async (): Promise<BlogPost[]> => {
      const res = await this.request<{ blogs: BlogPost[] }>("/api/blogs");
      return (res.blogs || res.data || []) as BlogPost[];
    },

    /**
     * Get blog post by slug
     */
    getBySlug: async (slug: string): Promise<BlogPost | null> => {
      const res = await this.request<{ blog: BlogPost }>(`/api/blogs/slug/${encodeURIComponent(slug)}`);
      return res.blog || (res.data as unknown as BlogPost) || null;
    },

    /**
     * Get public author profiles
     */
    getAuthors: async () => {
      const res = await this.request("/api/authors");
      return res.authors || res.data || [];
    }
  };


  // ── 4. Reviews & Ratings API ───────────────────────────────
  public reviews = {
    /**
     * Get all verified traveler reviews
     */
    getAll: async (): Promise<CustomerReview[]> => {
      const res = await this.request<{ reviews: CustomerReview[] }>("/api/reviews");
      return (res.reviews || res.data || []) as CustomerReview[];
    },

    /**
     * Get reviews specifically for a package
     */
    getByPackage: async (packageId: string): Promise<CustomerReview[]> => {
      const res = await this.request<{ reviews: CustomerReview[] }>(`/api/reviews/package/${encodeURIComponent(packageId)}`);
      return (res.reviews || res.data || []) as CustomerReview[];
    },

    /**
     * Submit a customer review
     */
    submit: async (data: {
      package_id?: string;
      customer_name: string;
      customer_email?: string;
      rating: number;
      review_text: string;
      photos?: string[];
    }): Promise<ApiResponse> => {
      return this.request("/api/reviews/submit", {
        method: "POST",
        body: JSON.stringify(data)
      });
    }
  };

  // ── 5. Forms, Leads & Inquiries API ────────────────────────
  public forms = {
    /**
     * Submit general travel lead or contact form
     */
    submitLead: async (payload: FormSubmissionPayload): Promise<ApiResponse> => {
      return this.request("/api/forms/submit", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    },

    /**
     * Submit itinerary booking inquiry
     */
    submitInquiry: async (payload: FormSubmissionPayload): Promise<ApiResponse> => {
      return this.request("/api/inquiries", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }
  };

  // ── 6. Customer Authentication & Profile API ───────────────
  public auth = {
    /**
     * Sign up customer with email and password
     */
    signUp: async (data: {
      email: string;
      password: string;
      full_name: string;
      phone?: string;
    }): Promise<AuthSessionResponse> => {
      const res = await this.request<AuthSessionResponse>("/api/customer/signup", {
        method: "POST",
        body: JSON.stringify(data)
      });
      const token = res.token || res.accessToken;
      if (token) {
        this.setAuthToken(token);
      }
      return res;
    },

    /**
     * Login customer with email and password
     */
    login: async (data: {
      email: string;
      password: string;
    }): Promise<AuthSessionResponse> => {
      const res = await this.request<AuthSessionResponse>("/api/customer/login", {
        method: "POST",
        body: JSON.stringify(data)
      });
      const token = res.token || res.accessToken;
      if (token) {
        this.setAuthToken(token);
      }
      return res;
    },

    /**
     * Send OTP to customer phone or email
     */
    sendOtp: async (data: {
      identifier: string; // phone or email
      channel?: "sms" | "whatsapp" | "email";
    }): Promise<ApiResponse> => {
      return this.request("/api/otp/send", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },

    /**
     * Verify OTP and establish logged-in session
     */
    verifyOtp: async (data: {
      identifier: string;
      otp: string;
    }): Promise<AuthSessionResponse> => {
      const res = await this.request<AuthSessionResponse>("/api/otp/verify", {
        method: "POST",
        body: JSON.stringify(data)
      });
      const token = res.token || res.accessToken;
      if (token) {
        this.setAuthToken(token);
      }
      return res;
    },

    /**
     * Get current authenticated traveler profile
     */
    getProfile: async (): Promise<CustomerUser | null> => {
      const res = await this.request<{ customer: CustomerUser; profile: CustomerUser }>("/api/customer/profile");
      return res.customer || res.profile || (res.data as unknown as CustomerUser) || null;
    },


    /**
     * Update customer traveler profile
     */
    updateProfile: async (data: Partial<CustomerUser>): Promise<ApiResponse> => {
      return this.request("/api/customer/profile", {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },

    /**
     * Get traveler's past and upcoming booked itineraries
     */
    getBookings: async (): Promise<BookingRecord[]> => {
      const res = await this.request<{ bookings: BookingRecord[] }>("/api/customer/bookings");
      return (res.bookings || res.data || []) as BookingRecord[];
    },

    /**
     * Log out customer and clear stored tokens
     */
    logout: async (): Promise<void> => {
      try {
        await this.request("/api/customer/logout", { method: "POST" });
      } finally {
        this.setAuthToken(null);
      }
    }
  };

  // ── 7. Payment Checkout API ────────────────────────────────
  public payments = {
    /**
     * Create Razorpay / multi-currency payment order for a package booking deposit
     */
    createOrder: async (params: PaymentOrderParams): Promise<ApiResponse> => {
      return this.request("/api/payment/create-order", {
        method: "POST",
        body: JSON.stringify(params)
      });
    },

    /**
     * Verify payment signature post-checkout
     */
    verifyPayment: async (params: PaymentVerifyParams): Promise<ApiResponse> => {
      return this.request("/api/payment/verify", {
        method: "POST",
        body: JSON.stringify(params)
      });
    }
  };

  // ── 8. Analytics & Telemetry API ───────────────────────────
  public analytics = {
    /**
     * Track page views and customer interaction events
     */
    trackEvent: async (eventName: string, properties: Record<string, any> = {}): Promise<void> => {
      try {
        await this.request("/api/analytics/track", {
          method: "POST",
          body: JSON.stringify({
            event: eventName,
            properties,
            domain: this.domain,
            url: typeof window !== "undefined" ? window.location.href : undefined,
            timestamp: new Date().toISOString()
          })
        });
      } catch {}
    }
  };
}

/**
 * Singleton factory instance for convenience
 */
export const createTraveallyClient = (config: TraveallyApiConfig = {}) => new TraveallyClient(config);
export default TraveallyClient;
