import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import {
  TraveallyChatbotConfig,
  ChatbotContextValue,
  ChatMessage,
  OrganizationBranding,
  FormField,
} from "./types";
import { generateSecureSessionId, ClientRateLimiter } from "./security";
import { fetchOrganizationBranding, fetchChatbotConfig, sendChatToBackend } from "./api";

const DEFAULT_FORM_FIELDS: FormField[] = [
  { id: "name", label: "Full Name", type: "text", required: true, enabled: true, placeholder: "e.g. Rahul Sharma" },
  { id: "email", label: "Email Address", type: "email", required: false, enabled: true, placeholder: "e.g. rahul@example.com" },
  { id: "phone", label: "WhatsApp / Phone", type: "tel", required: true, enabled: true, placeholder: "e.g. +91 98765 43210" },
  { id: "destination", label: "Destination / Trip Plan", type: "text", required: false, enabled: true, placeholder: "e.g. 5-day Bali Trip" },
];

const ChatbotContext = createContext<ChatbotContextValue | undefined>(undefined);

export interface TraveallyChatbotProviderProps {
  children: React.ReactNode;
  config?: TraveallyChatbotConfig;
}

export const TraveallyChatbotProvider: React.FC<TraveallyChatbotProviderProps> = ({
  children,
  config = {},
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(Boolean(config.defaultOpen));
  const [branding, setBranding] = useState<OrganizationBranding | null>(null);
  const [backendConfig, setBackendConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [activeError, setActiveError] = useState<string | null>(null);

  // Derive stable domain
  const resolvedDomain = useMemo(() => {
    if (config.domain) return config.domain;
    if (typeof window !== "undefined" && window.location?.hostname) {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1") return "traveally.com";
      return host;
    }
    return "traveally.com";
  }, [config.domain]);

  // Traveler state & lead form submission tracking
  const [travelerData, setTravelerData] = useState<Record<string, any>>(() => config.traveler || {});
  const [hasSubmittedLead, setHasSubmittedLead] = useState<boolean>(() => {
    if (config.isAuthenticated || config.customerToken || config.traveler?.userId) return true;
    if (typeof window !== "undefined" && window.sessionStorage) {
      return Boolean(window.sessionStorage.getItem(`tvl_lead_submitted_${resolvedDomain}`));
    }
    return false;
  });

  // Session ID
  const sessionIdRef = useRef<string>(generateSecureSessionId());

  // Rate Limiter
  const rateLimiterRef = useRef<ClientRateLimiter>(
    new ClientRateLimiter(config.rateLimitMaxPerMinute || 20, 60000)
  );

  // Initial welcome message
  const initialMessages = useMemo<ChatMessage[]>(() => {
    const welcome =
      config.welcomeMessage ||
      backendConfig?.welcome_message ||
      `Hello! 🌴 Welcome to **${branding?.name || "Traveally"}**. How can I help you plan your dream holiday or answer questions today?`;

    return [
      {
        id: "msg-welcome",
        sender: "bot",
        text: welcome,
        createdAt: new Date().toISOString(),
      },
    ];
  }, [config.welcomeMessage, backendConfig?.welcome_message, branding?.name]);

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  // 1. Fetch organization branding and dynamic configuration from backend
  useEffect(() => {
    let isMounted = true;

    async function loadBackendData() {
      try {
        const [brand, bConfig] = await Promise.all([
          fetchOrganizationBranding(resolvedDomain, config.backendUrl),
          fetchChatbotConfig(resolvedDomain, config.backendUrl),
        ]);

        if (isMounted) {
          if (brand) {
            setBranding(brand);
            config.onBrandingLoaded?.(brand);
          }
          if (bConfig) {
            setBackendConfig(bConfig);
          }
        }
      } catch (err) {
        console.error("[@traveally/chatbot] Init error:", err);
      }
    }

    loadBackendData();

    return () => {
      isMounted = false;
    };
  }, [resolvedDomain, config.backendUrl]);

  // Sync welcome message if branding resolves later and there is only 1 message
  useEffect(() => {
    if (branding && messages.length === 1 && messages[0].id === "msg-welcome" && !config.welcomeMessage) {
      setMessages([
        {
          id: "msg-welcome",
          sender: "bot",
          text: `Hello! 🌴 Welcome to **${branding.name}**. How can I help you plan your dream holiday or answer questions today?`,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }, [branding, config.welcomeMessage]);

  const open = () => {
    setIsOpen(true);
    config.onToggle?.(true);
  };

  const close = () => {
    setIsOpen(false);
    config.onToggle?.(false);
  };

  const toggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      config.onToggle?.(next);
      return next;
    });
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const clearError = () => {
    setActiveError(null);
  };

  // Determine whether lead form is required
  const effectiveRequireLead =
    config.requireLeadForm !== undefined
      ? config.requireLeadForm
      : backendConfig?.require_lead_form ?? true;

  const isLeadFormNeeded =
    !config.isAuthenticated &&
    !config.customerToken &&
    !config.traveler?.userId &&
    !hasSubmittedLead &&
    effectiveRequireLead;

  const formFields: FormField[] =
    config.formFields || backendConfig?.form_fields || DEFAULT_FORM_FIELDS;

  // Lead Form Submission handler
  const submitLead = async (formData: Record<string, string>) => {
    setHasSubmittedLead(true);
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(`tvl_lead_submitted_${resolvedDomain}`, "true");
    }

    const updatedTraveler = {
      ...travelerData,
      name: formData.name || travelerData.name || "Website Traveler",
      email: formData.email || travelerData.email,
      phone: formData.phone || travelerData.phone,
      ...formData,
    };
    setTravelerData(updatedTraveler);
    config.onLeadSubmitted?.(updatedTraveler);

    // Initial greeting / prompt from traveler
    const destinationNote = formData.destination ? `Interested in: ${formData.destination}` : "Hello! I would like to inquire about holiday packages.";
    await sendMessage(destinationNote);
  };

  // Send message handler with security rate limiting & backend dispatch
  const sendMessage = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    // Security check: Rate Limiting
    const check = rateLimiterRef.current.canProceed();
    if (!check.allowed) {
      setActiveError(`Please wait ${check.retryAfterSeconds}s before sending another message.`);
      return;
    }

    clearError();

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: "user",
      text: cleanText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setIsLoading(true);

    try {
      let botReplyText = "";
      let botMetadata = undefined;

      if (typeof config.onSendMessage === "function") {
        const customRes = await config.onSendMessage(cleanText, {
          sessionId: sessionIdRef.current,
          domain: resolvedDomain,
        });

        if (typeof customRes === "string") {
          botReplyText = customRes;
        } else if (customRes && customRes.reply) {
          botReplyText = customRes.reply;
          botMetadata = customRes.metadata;
        }
      } else {
        const response = await sendChatToBackend({
          text: cleanText,
          sessionId: sessionIdRef.current,
          domain: resolvedDomain,
          backendUrl: config.backendUrl,
          customerToken: config.customerToken,
          traveler: travelerData,
        });

        botReplyText = response.reply;
        botMetadata = response.metadata;
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender: "bot",
        text: botReplyText,
        senderName: branding?.name || config.title || backendConfig?.title || "Travel Assistant",
        avatarUrl: config.avatarUrl || branding?.logo || backendConfig?.logo || undefined,
        createdAt: new Date().toISOString(),
        metadata: botMetadata,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error("[@traveally/chatbot] Send error:", err);
      const errorMessage: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: "bot",
        text: "I encountered a momentary connection issue. Please feel free to try again or reach out to our team directly! 🙏",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const contextValue: ChatbotContextValue = {
    isOpen,
    open,
    close,
    toggle,
    messages,
    sendMessage,
    clearMessages,
    isLoading,
    isTyping,
    branding,
    config: {
      ...config,
      domain: resolvedDomain,
    },
    sessionId: sessionIdRef.current,
    activeError,
    clearError,
    isLeadFormNeeded,
    formFields,
    submitLead,
    travelerData,
  };

  return <ChatbotContext.Provider value={contextValue}>{children}</ChatbotContext.Provider>;
};

export function useTraveallyChatbot(): ChatbotContextValue {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error(
      "useTraveallyChatbot must be used within a <TraveallyChatbotProvider> or <TraveallyChatbot>."
    );
  }
  return context;
}
