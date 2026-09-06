/**
 * Backend API communication client for @traveally/chatbot
 * Connects to backend.traveally.com for dynamic organization branding & conversational AI.
 */

import { OrganizationBranding, ChatMessageMetadata, PackageSummary } from "./types";
import { isSafeUrl } from "./security";

const DEFAULT_BACKEND_URL = "https://backend.traveally.com";
const BRANDING_CACHE_KEY_PREFIX = "tvl_brand_cache_";

/**
 * Fetch organization branding (logo, name, icon) from backend.traveally.com
 */
export async function fetchOrganizationBranding(
  domain: string,
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<OrganizationBranding> {
  const normalizedDomain = (domain || "traveally.com").trim().toLowerCase();
  const cacheKey = `${BRANDING_CACHE_KEY_PREFIX}${normalizedDomain}`;

  // Check sessionStorage cache to minimize round-trips
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const cached = window.sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object" && parsed.name) {
          return parsed as OrganizationBranding;
        }
      }
    } catch {
      // Ignore cache retrieval failure
    }
  }

  const cleanBackend = backendUrl.replace(/\/+$/, "");
  const targetUrl = `${cleanBackend}/api/dashboard/public/resolve/${encodeURIComponent(normalizedDomain)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-org-domain": normalizedDomain,
        "x-traveally-client": "chatbot-sdk",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      if (json && json.success && json.data) {
        const data = json.data;
        let resolvedLogo = data.logo || null;

        // If logo is a relative path, prefix with backendUrl
        if (resolvedLogo && !resolvedLogo.startsWith("http") && !resolvedLogo.startsWith("data:")) {
          resolvedLogo = `${cleanBackend}${resolvedLogo.startsWith("/") ? "" : "/"}${resolvedLogo}`;
        }

        let resolvedIcon = data.icon || null;
        if (resolvedIcon && !resolvedIcon.startsWith("http") && !resolvedIcon.startsWith("data:")) {
          resolvedIcon = `${cleanBackend}${resolvedIcon.startsWith("/") ? "" : "/"}${resolvedIcon}`;
        }

        const brandingResult: OrganizationBranding = {
          name: data.name || "Traveally",
          logo: resolvedLogo,
          icon: resolvedIcon,
          org_id: data.org_id,
          is_platform: Boolean(data.is_platform),
          banners: data.banners,
        };

        // Cache for current browser session
        if (typeof window !== "undefined" && window.sessionStorage) {
          try {
            window.sessionStorage.setItem(cacheKey, JSON.stringify(brandingResult));
          } catch {
            // Ignore storage quota errors
          }
        }

        return brandingResult;
      }
    }
  } catch (err) {
    console.warn("[@traveally/chatbot] Branding fetch notice: Using fallback branding.", err);
  }

  // Graceful fallback branding
  return {
    name: "Traveally",
    logo: "https://backend.traveally.com/logo.png",
    icon: null,
    is_platform: true,
  };
}

/**
 * Fetch dynamic chatbot configuration and lead gate policies from backend
 */
export async function fetchChatbotConfig(
  domain: string,
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<any> {
  const cleanBackend = backendUrl.replace(/\/+$/, "");
  const normalizedDomain = (domain || "traveally.com").trim().toLowerCase();

  try {
    const res = await fetch(`${cleanBackend}/api/chat/config/${encodeURIComponent(normalizedDomain)}`, {
      headers: {
        Accept: "application/json",
        "x-org-domain": normalizedDomain,
      },
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    // Graceful offline fallback
  }
  return null;
}

/**
 * Retrieve persistent conversation and messages for visitor session
 */
export async function fetchSessionData(
  sessionId: string,
  domain: string,
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<{ conversation: any; messages: any[] }> {
  const cleanBackend = backendUrl.replace(/\/+$/, "");
  try {
    const res = await fetch(`${cleanBackend}/api/chat/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-org-domain": domain,
        "x-session-id": sessionId,
      },
      body: JSON.stringify({ session_id: sessionId, domain }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return {
          conversation: data.conversation,
          messages: Array.isArray(data.messages) ? data.messages : [],
        };
      }
    }
  } catch {
    // Non-fatal
  }
  return { conversation: null, messages: [] };
}

/**
 * Fetch messages for a specific conversation ID
 */
export async function fetchConversationMessages(
  conversationId: string,
  sessionId: string,
  domain: string,
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<any[]> {
  const cleanBackend = backendUrl.replace(/\/+$/, "");
  try {
    const res = await fetch(`${cleanBackend}/api/chat/conversations/${encodeURIComponent(conversationId)}/messages?session_id=${encodeURIComponent(sessionId)}`, {
      headers: {
        Accept: "application/json",
        "x-org-domain": domain,
        "x-session-id": sessionId,
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch {
    // Non-fatal
  }
  return [];
}

/**
 * Fetch packages for @ package mentions in chatbot
 */
export async function fetchOrgPackages(
  domain: string,
  query?: string,
  backendUrl: string = DEFAULT_BACKEND_URL
): Promise<PackageSummary[]> {
  const cleanBackend = backendUrl.replace(/\/+$/, "");
  const normalizedDomain = (domain || "traveally.com").trim().toLowerCase();
  const q = (query || "").trim();
  const targetUrl = `${cleanBackend}/api/chat/packages?domain=${encodeURIComponent(normalizedDomain)}${q ? `&q=${encodeURIComponent(q)}` : ""}&limit=4`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(targetUrl, {
      headers: {
        Accept: "application/json",
        "x-org-domain": normalizedDomain,
        "x-traveally-client": "chatbot-sdk",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.packages)) {
        return data.packages;
      }
    }
  } catch (err) {
    console.warn("[@traveally/chatbot] Package search error:", err);
  }
  return [];
}

/**
 * Send conversational message to backend.traveally.com
 */
export async function sendChatToBackend(params: {
  text: string;
  sessionId: string;
  domain: string;
  backendUrl?: string;
  customerToken?: string;
  metadata?: Record<string, any>;
  traveler?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}): Promise<{ reply: string | null; senderName?: string; conversationId?: string; metadata?: ChatMessageMetadata }> {
  const { text, sessionId, domain, backendUrl = DEFAULT_BACKEND_URL, customerToken, traveler, metadata } = params;
  const cleanBackend = backendUrl.replace(/\/+$/, "");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-org-domain": domain,
    "x-session-id": sessionId,
    "x-traveally-client": "chatbot-sdk",
  };

  if (customerToken) {
    headers["Authorization"] = `Bearer ${customerToken}`;
  }

  // First attempt dedicated chatbot / AI conversational endpoint
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const chatEndpoint = `${cleanBackend}/api/chat/message`;
    const response = await fetch(chatEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: text,
        session_id: sessionId,
        domain,
        channel: "website_chatbot",
        traveler,
        metadata,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.success) {
        return {
          reply: data.reply || null,
          senderName: data.sender_name || data.senderName,
          conversationId: data.conversation_id,
          metadata: data.metadata,
        };
      }
      if (data && data.reply) {
        return {
          reply: data.reply,
          senderName: data.sender_name || data.senderName,
          conversationId: data.conversation_id,
          metadata: data.metadata,
        };
      }
    }
  } catch {
    // Gracefully fall back to inquiry submission or intelligent travel assistant
  }

  // Check if message is a booking inquiry or lead
  const isLeadOrInquiry =
    /contact|call|phone|email|price|package|quote|book|deal|tour|destination|bali|dubai|kerala/i.test(text);

  if (isLeadOrInquiry && (traveler?.email || traveler?.phone)) {
    try {
      const inquiryRes = await fetch(`${cleanBackend}/api/inquiries`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          domain,
          name: traveler?.name || "Website Traveler",
          email: traveler?.email,
          phone: traveler?.phone,
          message: text,
          inquiry_type: "chat_inquiry",
          source: "website_chatbot",
        }),
      });

      if (inquiryRes.ok) {
        return {
          reply: `Thank you for sharing your details! 🎒 Our travel specialist for **${domain}** has received your request and will reach out to you shortly via ${traveler?.phone ? "WhatsApp/Call" : "Email"}.`,
          metadata: { type: "inquiry" },
        };
      }
    } catch {
      // Continue to intelligent fallback reply
    }
  }

  // Natural response fallback for real-time travel assistance
  return generateIntelligentFallbackReply(text, domain);
}

/**
 * Intelligent client-side conversational responses for travel guidance
 */
function generateIntelligentFallbackReply(
  userText: string,
  domain: string
): { reply: string; metadata?: ChatMessageMetadata } {
  const query = userText.toLowerCase().trim();

  if (/^(hi|hello|hey|namaste|greetings)/i.test(query)) {
    return {
      reply: `Hello! 👋 Welcome to **${domain}**. I am your personal AI Travel Concierge. How may I assist with your upcoming journey today?\n\n• Explore curated holiday packages\n• Get a customized itinerary quote\n• Check flight/hotel options\n• Speak to a destination expert`,
    };
  }

  if (/quote|custom|customized|itinerary|plan/i.test(query)) {
    return {
      reply: `I can help you build a personalized travel plan! 🗺️ Could you please share:\n\n1. Where would you like to go?\n2. Number of travelers & approximate travel dates?\n3. Any budget preference?`,
      metadata: { type: "quote", title: "Custom Itinerary Request" },
    };
  }

  if (/package|tours|trip|destination|place/i.test(query)) {
    return {
      reply: `We have great packages available right now for **Bali**, **Dubai**, **Thailand**, **Europe**, and scenic domestic escapes like **Himachal**, **Kashmir**, and **Kerala**! 🌴\n\nWould you like domestic or international packages?`,
      metadata: {
        type: "package",
        title: "Popular Destinations",
      },
    };
  }

  if (/agent|human|talk|representative|support|call|phone|whatsapp/i.test(query)) {
    return {
      reply: `Certainly! Our destination specialists are available to assist you. Please provide your **email** or **WhatsApp number**, and our team will get in touch directly! 📞`,
    };
  }

  if (/price|cost|fare|budget|rate|expensive|cheap/i.test(query)) {
    return {
      reply: `Our packages range from budget-friendly group tours to premium 5-star private luxury pool villas! Let us know your preferred destination and dates to get the best seasonal pricing. ✨`,
    };
  }

  return {
    reply: `Thank you for contacting **${domain}**! Our travel team is reviewing your query. To get a quick customized itinerary and best rates, please feel free to leave your contact number or destination details! ✈️`,
  };
}
