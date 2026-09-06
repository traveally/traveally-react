import React, { useState, useMemo, useRef, CSSProperties } from "react";
import { TraveallyChatbotConfig, QuickPrompt, PackageSummary } from "./types";
import { TraveallyChatbotProvider, useTraveallyChatbot } from "./ChatbotContext";
import { MessageList } from "./MessageList";
import { QuickPrompts } from "./QuickPrompts";
import { LeadForm } from "./LeadForm";
import { PackageMentionDropdown } from "./PackageMentionDropdown";
import { fetchOrgPackages } from "./api";
import { MessageSquare, X, Send, Bot, RotateCcw, AlertTriangle } from "lucide-react";
import "./chatbot.css";

const DEFAULT_PROMPTS: QuickPrompt[] = [
  { id: "p-packages", label: "🌴 Explore Top Packages", message: "What are your most popular holiday packages?" },
  { id: "p-quote", label: "📝 Custom Itinerary Quote", message: "I would like a customized trip proposal" },
  { id: "p-agent", label: "📞 Speak with an Expert", message: "Can I speak to a travel specialist?" },
];

/**
 * Inner Chatbot View component consuming ChatbotContext
 */
const ChatbotInnerView: React.FC = () => {
  const {
    isOpen,
    toggle,
    close,
    messages,
    sendMessage,
    sendTyping,
    clearMessages,
    isTyping,
    isAgentTyping,
    activeAgentName,
    isLoading,
    branding,
    config,
    activeError,
    clearError,
    isLeadFormNeeded,
    formFields,
    submitLead,
  } = useTraveallyChatbot();

  const [inputVal, setInputVal] = useState("");
  const typingTimerRef = useRef<any>(null);

  // Package Mention (@) Autocomplete State
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPackages, setMentionPackages] = useState<PackageSummary[]>([]);
  const [isSearchingPackages, setIsSearchingPackages] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageSummary | null>(null);
  const searchDebounceRef = useRef<any>(null);

  const resolvedDomain =
    config.domain || (typeof window !== "undefined" ? window.location.hostname : "traveally.com");

  const triggerPackageSearch = (query: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setIsSearchingPackages(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const pkgs = await fetchOrgPackages(resolvedDomain, query, config.backendUrl);
        setMentionPackages(pkgs);
      } catch {
        setMentionPackages([]);
      } finally {
        setIsSearchingPackages(false);
      }
    }, 150);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    sendTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);

    // Check for '@' mention
    const atIndex = val.lastIndexOf("@");
    if (atIndex !== -1) {
      const textAfterAt = val.slice(atIndex + 1);
      if (!textAfterAt.includes("  ")) {
        setShowMentions(true);
        setMentionQuery(textAfterAt);
        triggerPackageSearch(textAfterAt);
        return;
      }
    }
    setShowMentions(false);
  };

  const handleSelectMentionPackage = (pkg: PackageSummary) => {
    setSelectedPackage(pkg);
    const atIndex = inputVal.lastIndexOf("@");
    if (atIndex !== -1) {
      const beforeAt = inputVal.slice(0, atIndex);
      setInputVal(`${beforeAt}@${pkg.package_name} `);
    } else {
      setInputVal((prev) => `${prev} @${pkg.package_name} `);
    }
    setShowMentions(false);
  };

  const theme = config.theme || {};
  const position = config.position || "bottom-right";
  const variant = config.variant || "floating";

  // Dynamic color scheme styles mapped to CSS variables
  const containerStyle = useMemo<CSSProperties>(() => {
    const style: Record<string, string> = {};

    if (theme.primaryColor) {
      style["--traveally-cb-primary"] = theme.primaryColor;
      style["--traveally-cb-user-bubble"] = theme.userBubbleColor || theme.primaryColor;
      style["--traveally-cb-primary-gradient"] = `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor || "#008287"} 100%)`;
    }
    if (theme.secondaryColor) {
      style["--traveally-cb-secondary"] = theme.secondaryColor;
    }
    if (theme.accentColor) {
      style["--traveally-cb-accent"] = theme.accentColor;
    }
    if (theme.backgroundColor) {
      style["--traveally-cb-bg"] = theme.backgroundColor;
      style["--traveally-cb-glass-bg"] = theme.backgroundColor;
    }
    if (theme.textColor) {
      style["--traveally-cb-text"] = theme.textColor;
    }
    if (theme.botBubbleColor) {
      style["--traveally-cb-bot-bubble"] = theme.botBubbleColor;
    }
    if (theme.botTextColor) {
      style["--traveally-cb-bot-text"] = theme.botTextColor;
    }
    if (theme.userTextColor) {
      style["--traveally-cb-user-text"] = theme.userTextColor;
    }
    if (theme.borderRadius) {
      style["--traveally-cb-radius"] = theme.borderRadius;
    }
    if (theme.fontFamily) {
      style["--traveally-cb-font"] = theme.fontFamily;
    }

    return style as CSSProperties;
  }, [theme]);

  // Dynamic short logo & full logo resolution: User override > Backend resolved icon > Fallback
  const resolvedShortLogo = config.iconUrl || branding?.icon || config.logoUrl || branding?.logo || null;
  const resolvedLogo = config.logoUrl || branding?.logo || resolvedShortLogo;
  const resolvedTitle = config.title || branding?.name || "Travel Concierge";
  const resolvedSubtitle = config.subtitle || "Travel Concierge • Online";

  const quickPrompts = config.quickPrompts || DEFAULT_PROMPTS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;
    if (selectedPackage) {
      sendMessage(inputVal, { type: "package", package: selectedPackage });
      setSelectedPackage(null);
    } else {
      sendMessage(inputVal);
    }
    setInputVal("");
    setShowMentions(false);
  };

  const handlePromptSelect = (promptMsg: string) => {
    sendMessage(promptMsg);
  };

  const isDarkMode =
    theme.mode === "dark" ||
    (theme.mode === "auto" &&
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  const windowClasses = [
    "traveally-cb-window",
    variant === "inline" ? "inline" : "",
    isDarkMode ? "traveally-cb-dark" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && variant === "floating") {
      close();
    }
  };

  return (
    <div
      className={`traveally-cb-root ${isDarkMode ? "traveally-cb-dark" : ""}`}
      style={containerStyle}
      onKeyDown={handleKeyDown}
    >
      {/* 1. Floating Launcher Button (if variant="floating") */}
      {variant === "floating" && (
        <div className={`traveally-cb-launcher-wrap ${position}`}>
          {isOpen && (
            <div className={windowClasses} role="dialog" aria-label="Traveally Chat Concierge">
              {/* Header */}
              <div className="traveally-cb-header">
                <div className="traveally-cb-header-left">
                  <div className="traveally-cb-logo-wrap">
                    {resolvedShortLogo ? (
                      <img src={resolvedShortLogo} alt={resolvedTitle} className="traveally-cb-logo-img" />
                    ) : (
                      <MessageSquare size={20} style={{ color: "var(--traveally-cb-secondary)" }} />
                    )}
                  </div>
                  <div className="traveally-cb-header-titles">
                    <h3 className="traveally-cb-header-title">{resolvedTitle}</h3>
                    <div className="traveally-cb-header-status">
                      <span className="traveally-cb-status-dot" />
                      <span>{resolvedSubtitle}</span>
                    </div>
                  </div>
                </div>

                <div className="traveally-cb-header-actions">
                  <button
                    type="button"
                    className="traveally-cb-icon-btn"
                    onClick={clearMessages}
                    title="Reset Conversation"
                    aria-label="Reset Conversation"
                  >
                    <RotateCcw size={15} />
                  </button>
                  <button
                    type="button"
                    className="traveally-cb-icon-btn"
                    onClick={close}
                    title="Close Chat"
                    aria-label="Close Chat"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {isLeadFormNeeded ? (
                <LeadForm
                  fields={formFields}
                  primaryColor={theme.primaryColor || "#022247"}
                  onSubmit={submitLead}
                  isLoading={isLoading}
                />
              ) : (
                <>
                  {/* Message List */}
                  <MessageList
                    messages={messages}
                    isTyping={isTyping}
                    isAgentTyping={isAgentTyping}
                    activeAgentName={activeAgentName}
                    botAvatar={resolvedShortLogo || resolvedLogo}
                    botName={resolvedTitle}
                    domain={resolvedDomain}
                  />

                  {/* Quick Prompts (visible if conversation is early) */}
                  {messages.length <= 2 && (
                    <div style={{ padding: "0 14px" }}>
                      <QuickPrompts prompts={quickPrompts} onSelect={handlePromptSelect} disabled={isLoading} />
                    </div>
                  )}

                  {/* Footer Input Area */}
                  <div className="traveally-cb-footer">
                    {showMentions && (
                      <PackageMentionDropdown
                        packages={mentionPackages}
                        isLoading={isSearchingPackages}
                        query={mentionQuery}
                        onSelect={handleSelectMentionPackage}
                        onClose={() => setShowMentions(false)}
                      />
                    )}

                    {activeError && (
                      <div className="traveally-cb-error-banner">
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <AlertTriangle size={13} />
                          <span>{activeError}</span>
                        </div>
                        <button
                          type="button"
                          onClick={clearError}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}

                    <form className="traveally-cb-form" onSubmit={handleSubmit}>
                      <input
                        type="text"
                        className="traveally-cb-input"
                        placeholder="Ask about tours, flights, custom itineraries..."
                        value={inputVal}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        maxLength={1000}
                        aria-label="Chat message"
                      />
                      <button
                        type="submit"
                        className="traveally-cb-send-btn"
                        disabled={!inputVal.trim() || isLoading}
                        aria-label="Send message"
                      >
                        <Send size={16} />
                      </button>
                    </form>

                    <div className="traveally-cb-powered-by">
                      <span>Powered By </span>
                      <a href="https://traveally.com" target="_blank" rel="noopener noreferrer">
                        Traveally.com
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Launcher Trigger Button */}
          <button
            type="button"
            className="traveally-cb-launcher-btn"
            onClick={toggle}
            aria-label={isOpen ? "Close Chat" : "Open Chat"}
            title={`Chat with ${resolvedTitle}`}
          >
            {isOpen ? (
              <X size={24} />
            ) : (
              <MessageSquare size={26} />
            )}
            <span className="traveally-cb-launcher-badge" />
          </button>
        </div>
      )}

      {/* 2. Inline Embed Mode (if variant="inline") */}
      {variant === "inline" && (
        <div className={windowClasses} role="region" aria-label="Traveally Chat Concierge">
          {/* Header */}
          <div className="traveally-cb-header">
            <div className="traveally-cb-header-left">
              <div className="traveally-cb-logo-wrap">
                {resolvedShortLogo ? (
                  <img src={resolvedShortLogo} alt={resolvedTitle} className="traveally-cb-logo-img" />
                ) : (
                  <MessageSquare size={20} style={{ color: "var(--traveally-cb-secondary)" }} />
                )}
              </div>
              <div className="traveally-cb-header-titles">
                <h3 className="traveally-cb-header-title">{resolvedTitle}</h3>
                <div className="traveally-cb-header-status">
                  <span className="traveally-cb-status-dot" />
                  <span>{resolvedSubtitle}</span>
                </div>
              </div>
            </div>

            <div className="traveally-cb-header-actions">
              <button
                type="button"
                className="traveally-cb-icon-btn"
                onClick={clearMessages}
                title="Reset Conversation"
                aria-label="Reset Conversation"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>

          {isLeadFormNeeded ? (
            <LeadForm
              fields={formFields}
              primaryColor={theme.primaryColor || "#022247"}
              onSubmit={submitLead}
              isLoading={isLoading}
            />
          ) : (
            <>
              {/* Message List */}
              <MessageList
                messages={messages}
                isTyping={isTyping}
                isAgentTyping={isAgentTyping}
                activeAgentName={activeAgentName}
                botAvatar={resolvedShortLogo || resolvedLogo}
                botName={resolvedTitle}
                domain={resolvedDomain}
              />

              {/* Quick Prompts */}
              {messages.length <= 2 && (
                <div style={{ padding: "0 14px" }}>
                  <QuickPrompts prompts={quickPrompts} onSelect={handlePromptSelect} disabled={isLoading} />
                </div>
              )}

              {/* Footer Input Area */}
              <div className="traveally-cb-footer">
                {showMentions && (
                  <PackageMentionDropdown
                    packages={mentionPackages}
                    isLoading={isSearchingPackages}
                    query={mentionQuery}
                    onSelect={handleSelectMentionPackage}
                    onClose={() => setShowMentions(false)}
                  />
                )}

                {activeError && (
                  <div className="traveally-cb-error-banner">
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <AlertTriangle size={13} />
                      <span>{activeError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearError}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                <form className="traveally-cb-form" onSubmit={handleSubmit}>
                  <input
                    type="text"
                    className="traveally-cb-input"
                    placeholder="Ask about tours, flights, custom itineraries..."
                    value={inputVal}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    maxLength={1000}
                    aria-label="Chat message"
                  />
                  <button
                    type="submit"
                    className="traveally-cb-send-btn"
                    disabled={!inputVal.trim() || isLoading}
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </button>
                </form>

                <div className="traveally-cb-powered-by">
                  <span>Powered By </span>
                  <a href="https://traveally.com" target="_blank" rel="noopener noreferrer">
                    Traveally.com
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Main Declarative TraveallyChatbot Component
 */
export interface TraveallyChatbotProps {
  config?: TraveallyChatbotConfig;
}

export const TraveallyChatbot: React.FC<TraveallyChatbotProps> = ({ config }) => {
  return (
    <TraveallyChatbotProvider config={config}>
      <ChatbotInnerView />
    </TraveallyChatbotProvider>
  );
};

/**
 * Convenient Alias: Chatbot
 */
export const Chatbot = TraveallyChatbot;

export default TraveallyChatbot;
