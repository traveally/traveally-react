import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import {
  TraveallyChatbotConfig,
  ChatbotContextValue,
  ChatMessage,
  OrganizationBranding,
  FormField,
} from "./types";
import { generateSecureSessionId, ClientRateLimiter } from "./security";
import {
  fetchOrganizationBranding,
  fetchChatbotConfig,
  sendChatToBackend,
  fetchSessionData,
  fetchConversationMessages
} from "./api";

const DEFAULT_FORM_FIELDS: FormField[] = [
  { id: "name", label: "Full Name", type: "text", required: true, enabled: true, placeholder: "e.g. Rahul Sharma" },
  { id: "email", label: "Email Address", type: "email", required: false, enabled: true, placeholder: "e.g. rahul@example.com" },
  { id: "phone", label: "WhatsApp / Phone", type: "tel", required: true, enabled: true, placeholder: "e.g. +91 98765 43210" },
  { id: "destination", label: "Destination / Trip Plan", type: "text", required: false, enabled: true, placeholder: "e.g. 5-day Bali Trip" },
];

function isSameSender(s1: string, s2: string): boolean {
  const norm1 = (s1 === "customer" || s1 === "user") ? "user" : s1;
  const norm2 = (s2 === "customer" || s2 === "user") ? "user" : s2;
  return norm1 === norm2;
}

function isDuplicateMessage(
  m: ChatMessage,
  incoming: { id?: string | number; text?: string; sender?: string; created_at?: string; createdAt?: string }
): boolean {
  if (incoming.id && String(m.id) === String(incoming.id)) return true;
  if (m.text && incoming.text && m.text.trim() === incoming.text.trim() && isSameSender(m.sender, incoming.sender || "")) {
    const mTime = new Date(m.createdAt).getTime();
    const inTime = new Date(incoming.created_at || incoming.createdAt || Date.now()).getTime();
    if (Math.abs(mTime - inTime) < 30000) return true;
  }
  return false;
}

const ChatbotContext = createContext<ChatbotContextValue | undefined>(undefined);

export interface TraveallyChatbotProviderProps {
  children: React.ReactNode;
  config?: TraveallyChatbotConfig;
}

function getPersistentSessionId(domain: string): string {
  if (typeof window === "undefined") return generateSecureSessionId();
  const key = `tvl_chat_session_${domain}`;
  try {
    let sid = window.localStorage?.getItem(key) || window.sessionStorage?.getItem(key);
    if (!sid) {
      sid = generateSecureSessionId();
      window.localStorage?.setItem(key, sid);
      window.sessionStorage?.setItem(key, sid);
    }
    return sid;
  } catch {
    return generateSecureSessionId();
  }
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
  const [isAgentTyping, setIsAgentTyping] = useState<boolean>(false);
  const [activeAgentName, setActiveAgentName] = useState<string | undefined>(undefined);
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

  // Persistent Session ID (preserved across refreshes and multiple tabs)
  const sessionIdRef = useRef<string>(getPersistentSessionId(resolvedDomain));

  // Persistent Active Conversation ID
  const [conversationId, setConversationId] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    try {
      return window.localStorage?.getItem(`tvl_chat_cid_${resolvedDomain}`) || undefined;
    } catch {
      return undefined;
    }
  });

  const updateConversationId = (id?: string) => {
    setConversationId(id);
    if (typeof window !== "undefined") {
      try {
        if (id) {
          window.localStorage?.setItem(`tvl_chat_cid_${resolvedDomain}`, id);
        } else {
          window.localStorage?.removeItem(`tvl_chat_cid_${resolvedDomain}`);
        }
      } catch {}
    }
  };

  // Traveler state & lead form submission tracking
  const [travelerData, setTravelerData] = useState<Record<string, any>>(() => {
    if (config.traveler && Object.keys(config.traveler).length > 0) return config.traveler;
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage?.getItem(`tvl_chat_traveler_${resolvedDomain}`);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return {};
  });
  const travelerDataRef = useRef<Record<string, any>>(travelerData);
  const [hasSubmittedLead, setHasSubmittedLead] = useState<boolean>(() => {
    if (config.isAuthenticated || config.customerToken || config.traveler?.userId) return true;
    if (typeof window !== "undefined") {
      return Boolean(
        window.localStorage?.getItem(`tvl_lead_submitted_${resolvedDomain}`) ||
        window.sessionStorage?.getItem(`tvl_lead_submitted_${resolvedDomain}`)
      );
    }
    return false;
  });

  // Rate Limiter
  const rateLimiterRef = useRef<ClientRateLimiter>(
    new ClientRateLimiter(config.rateLimitMaxPerMinute || 20, 60000)
  );

  const socketRef = useRef<any>(null);
  const agentTypingTimerRef = useRef<any>(null);

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

  // 2. Restore persistent chat history on mount if visitor previously chatted
  useEffect(() => {
    let isMounted = true;

    async function restoreHistory() {
      const sid = sessionIdRef.current;
      if (!sid) return;

      try {
        const data = await fetchSessionData(sid, resolvedDomain, config.backendUrl);
        if (isMounted && data.conversation) {
          updateConversationId(data.conversation.id);

          if (Array.isArray(data.messages) && data.messages.length > 0) {
            const restored: ChatMessage[] = data.messages.map((m: any) => ({
              id: String(m.id),
              sender: (m.sender === "agent" ? "agent" : m.sender === "customer" ? "user" : "bot") as any,
              text: m.text || "",
              senderName: m.sender_name || (m.sender === "agent" ? "Travel Specialist" : undefined),
              avatarUrl: m.media_url,
              createdAt: m.created_at || m.createdAt || new Date().toISOString(),
              metadata: m.metadata,
            }));

            setMessages((prev) => {
              // Prepend welcome if not in restored messages
              const hasWelcome = restored.some((m) => m.id === "msg-welcome");
              if (!hasWelcome && prev.length > 0 && prev[0].id === "msg-welcome") {
                return [prev[0], ...restored];
              }
              return restored.length > 0 ? restored : prev;
            });
          }
        }
      } catch (e) {
        console.warn("[@traveally/chatbot] History restore notice:", e);
      }
    }

    restoreHistory();

    return () => {
      isMounted = false;
    };
  }, [resolvedDomain, config.backendUrl]);

  // 3. Real-Time Socket.IO connection for instant two-way agent & visitor communication
  useEffect(() => {
    if (typeof window === "undefined") return;

    const targetUrl = config.backendUrl || "https://backend.traveally.com";
    let socket: any = null;

    try {
      socket = io(targetUrl, {
        transports: ["polling"],
        reconnectionAttempts: 15,
        reconnectionDelay: 3000,
        timeout: 20000,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join_chat", {
          organization: resolvedDomain,
          domain: resolvedDomain,
          role: "visitor",
          session_id: sessionIdRef.current,
          conversation_id: conversationId || undefined,
        });
      });

      // Receive real-time messages from dashboard agent
      socket.on("chat_new_message", (payload: { conversationId: string; message: any }) => {
        if (!payload?.message) return;
        const msg = payload.message;

        // Message matches current visitor conversation or session strictly (prevents cross-visitor leakage)
        const isMatch =
          (payload.conversationId && conversationId && payload.conversationId === conversationId) ||
          (msg.metadata?.sessionId && msg.metadata.sessionId === sessionIdRef.current) ||
          (msg.conversation_id && conversationId && msg.conversation_id === conversationId) ||
          (!conversationId && msg.metadata?.sessionId && msg.metadata.sessionId === sessionIdRef.current);

        if (isMatch) {
          if (payload.conversationId && (!conversationId || conversationId !== payload.conversationId)) {
            updateConversationId(payload.conversationId);
          }

          // Clear agent typing indicator
          setIsAgentTyping(false);

          setMessages((prev) => {
            const dupIndex = prev.findIndex((m) => isDuplicateMessage(m, msg));
            if (dupIndex !== -1) {
              if (prev[dupIndex].id.startsWith("user-") || prev[dupIndex].id.startsWith("bot-")) {
                const copy = [...prev];
                copy[dupIndex] = {
                  ...copy[dupIndex],
                  id: String(msg.id),
                  createdAt: msg.created_at || copy[dupIndex].createdAt,
                };
                return copy;
              }
              return prev;
            }

            const incoming: ChatMessage = {
              id: String(msg.id || `msg-${Date.now()}`),
              sender: (msg.sender === "agent" ? "agent" : msg.sender === "customer" ? "user" : "bot") as any,
              text: msg.text || "",
              senderName: msg.sender_name || (msg.sender === "agent" ? "Travel Specialist" : undefined),
              avatarUrl: msg.media_url,
              createdAt: msg.created_at || new Date().toISOString(),
              metadata: msg.metadata,
            };

            return [...prev, incoming];
          });
        }
      });

      // Receive typing events from dashboard agent
      socket.on("chat_typing", (data: { conversationId?: string; sessionId?: string; isTyping: boolean; sender: string; senderName?: string }) => {
        if (data?.sender === "admin" || data?.sender === "agent") {
          setIsAgentTyping(Boolean(data.isTyping));
          if (data.senderName) setActiveAgentName(data.senderName);

          if (agentTypingTimerRef.current) clearTimeout(agentTypingTimerRef.current);
          if (data.isTyping) {
            agentTypingTimerRef.current = setTimeout(() => {
              setIsAgentTyping(false);
            }, 3500);
          }
        }
      });
    } catch (e) {
      console.warn("[@traveally/chatbot] Socket notice:", e);
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [resolvedDomain, config.backendUrl, conversationId]);

  // 4. Polling Fallback (syncs every 3s when chat window is open and conversation is active)
  useEffect(() => {
    if (!isOpen || !conversationId) return;

    const intervalId = setInterval(async () => {
      try {
        const latest = await fetchConversationMessages(conversationId, sessionIdRef.current, resolvedDomain, config.backendUrl);
        if (Array.isArray(latest) && latest.length > 0) {
          setMessages((prev) => {
            let updated = false;
            const newMessages = [...prev];

            for (const m of latest) {
              const dupIndex = newMessages.findIndex((existing) => isDuplicateMessage(existing, m));
              if (dupIndex !== -1) {
                if (newMessages[dupIndex].id.startsWith("user-") || newMessages[dupIndex].id.startsWith("bot-")) {
                  newMessages[dupIndex] = {
                    ...newMessages[dupIndex],
                    id: String(m.id),
                    createdAt: m.created_at || newMessages[dupIndex].createdAt,
                  };
                  updated = true;
                }
              } else {
                updated = true;
                newMessages.push({
                  id: String(m.id),
                  sender: (m.sender === "agent" ? "agent" : m.sender === "customer" ? "user" : "bot") as any,
                  text: m.text || "",
                  senderName: m.sender_name || (m.sender === "agent" ? "Travel Specialist" : undefined),
                  avatarUrl: m.media_url,
                  createdAt: m.created_at || new Date().toISOString(),
                  metadata: m.metadata,
                });
              }
            }

            return updated ? newMessages : prev;
          });
        }
      } catch {}
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isOpen, conversationId, resolvedDomain, config.backendUrl]);

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
    const newSid = generateSecureSessionId();
    sessionIdRef.current = newSid;
    updateConversationId(undefined);
    if (typeof window !== "undefined") {
      try {
        window.localStorage?.setItem(`tvl_chat_session_${resolvedDomain}`, newSid);
        window.sessionStorage?.setItem(`tvl_chat_session_${resolvedDomain}`, newSid);
      } catch {}
    }
    setMessages(initialMessages);
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
    if (typeof window !== "undefined") {
      try {
        window.localStorage?.setItem(`tvl_lead_submitted_${resolvedDomain}`, "true");
        window.sessionStorage?.setItem(`tvl_lead_submitted_${resolvedDomain}`, "true");
      } catch {}
    }

    const updatedTraveler = {
      ...travelerData,
      name: formData.name || travelerData.name || "Website Traveler",
      email: formData.email || travelerData.email,
      phone: formData.phone || travelerData.phone,
      ...formData,
    };
    travelerDataRef.current = updatedTraveler;
    setTravelerData(updatedTraveler);
    if (typeof window !== "undefined") {
      try {
        window.localStorage?.setItem(`tvl_chat_traveler_${resolvedDomain}`, JSON.stringify(updatedTraveler));
      } catch {}
    }
    config.onLeadSubmitted?.(updatedTraveler);

    // Initial greeting / prompt from traveler with immediate updated traveler info
    const destinationNote = formData.destination ? `Interested in: ${formData.destination}` : "Hello! I would like to inquire about holiday packages.";
    await sendMessage(destinationNote, updatedTraveler);
  };

  // Typing emitter from visitor
  const sendTyping = (typing: boolean) => {
    if (!socketRef.current) return;
    try {
      socketRef.current.emit("chat_typing", {
        conversation_id: conversationId,
        session_id: sessionIdRef.current,
        is_typing: typing,
        sender: "visitor",
        sender_name: travelerDataRef.current?.name || travelerData.name || "Website Traveler",
        domain: resolvedDomain,
      });
    } catch {}
  };

  // Send message handler with security rate limiting & backend dispatch
  const sendMessage = async (text: string, customTraveler?: Record<string, any>) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    // Security check: Rate Limiting
    const check = rateLimiterRef.current.canProceed();
    if (!check.allowed) {
      setActiveError(`Please wait ${check.retryAfterSeconds}s before sending another message.`);
      return;
    }

    clearError();
    sendTyping(false);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: "user",
      text: cleanText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setIsLoading(true);

    const travelerToSend = customTraveler || travelerDataRef.current || travelerData;

    try {
      let botReplyText: string | null = null;
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
          traveler: travelerToSend,
        });

        if (response.conversationId && response.conversationId !== conversationId) {
          updateConversationId(response.conversationId);
        }

        botReplyText = response.reply;
        botMetadata = response.metadata;
      }

      // Only append bot message if an automated reply was generated (avoids fake bot spam in manual mode)
      if (botReplyText) {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          sender: "bot",
          text: botReplyText,
          senderName: branding?.name || config.title || backendConfig?.title || "Travel Assistant",
          avatarUrl: config.avatarUrl || branding?.icon || branding?.logo || backendConfig?.logo || undefined,
          createdAt: new Date().toISOString(),
          metadata: botMetadata,
        };

        setMessages((prev) => [...prev, botMessage]);
      }
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
    sendTyping,
    clearMessages,
    isLoading,
    isTyping,
    isAgentTyping,
    activeAgentName,
    branding,
    config: {
      ...config,
      domain: resolvedDomain,
    },
    sessionId: sessionIdRef.current,
    conversationId,
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
