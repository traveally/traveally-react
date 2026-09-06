import React, { useEffect, useRef } from "react";
import { ChatMessage } from "./types";
import { sanitizeMessageContent } from "./security";
import { Bot, User, ExternalLink, Compass } from "lucide-react";

interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
  isAgentTyping?: boolean;
  activeAgentName?: string;
  botAvatar?: string | null;
  botName?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  isAgentTyping,
  activeAgentName,
  botAvatar,
  botName = "Assistant",
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isAgentTyping]);

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  /**
   * Render text with sanitized links & basic bold/italic formatting
   */
  const renderFormattedText = (rawText: string) => {
    const sanitized = sanitizeMessageContent(rawText);

    // Split by lines
    const lines = sanitized.split("\n");
    return lines.map((line, lineIdx) => {
      // Bold **word**
      const parts = line.split(/(\*\*.*?\*\*)/g);

      return (
        <span key={lineIdx} style={{ display: "block", minHeight: line === "" ? "8px" : "auto" }}>
          {parts.map((part, partIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </span>
      );
    });
  };

  return (
    <div className="traveally-cb-body" role="log" aria-live="polite">
      {messages.map((msg) => {
        const isBotOrAgent = msg.sender === "bot" || msg.sender === "agent" || msg.sender === "system";
        const isAgent = msg.sender === "agent";

        return (
          <div key={msg.id} className={`traveally-cb-msg-row ${isBotOrAgent ? "bot" : "user"}`}>
            <div className="traveally-cb-avatar-bubble">
              {isBotOrAgent ? (
                botAvatar ? (
                  <img src={botAvatar} alt={msg.senderName || botName} />
                ) : (
                  <Bot size={16} />
                )
              ) : (
                <User size={15} />
              )}
            </div>

            <div className="traveally-cb-bubble-content">
              {isAgent && msg.senderName && (
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--traveally-cb-primary)", marginBottom: "2px", marginLeft: "2px" }}>
                  {msg.senderName}
                </div>
              )}
              <div className="traveally-cb-bubble">{renderFormattedText(msg.text)}</div>

              {/* Optional Rich Metadata Card */}
              {msg.metadata && msg.metadata.title && (
                <div
                  style={{
                    background: "rgba(0, 180, 186, 0.08)",
                    border: "1px solid rgba(0, 180, 186, 0.2)",
                    borderRadius: "10px",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    fontSize: "12px",
                    marginTop: "2px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Compass size={14} style={{ color: "var(--traveally-cb-primary)" }} />
                    <span style={{ fontWeight: 600 }}>{msg.metadata.title}</span>
                  </div>
                  {msg.metadata.url && (
                    <a
                      href={msg.metadata.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--traveally-cb-primary)", display: "flex", alignItems: "center" }}
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              )}

              <div className="traveally-cb-msg-time">{formatTime(msg.createdAt)}</div>
            </div>
          </div>
        );
      })}

      {(isTyping || isAgentTyping) && (
        <div className="traveally-cb-msg-row bot">
          <div className="traveally-cb-avatar-bubble">
            {botAvatar ? <img src={botAvatar} alt={botName} /> : <Bot size={16} />}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <span style={{ fontSize: "11px", color: "var(--traveally-cb-text-muted, #64748b)", marginLeft: "4px" }}>
              {isAgentTyping ? `${activeAgentName || "Travel Specialist"} is typing...` : `${botName} is typing...`}
            </span>
            <div className="traveally-cb-typing">
              <span className="traveally-cb-typing-dot" />
              <span className="traveally-cb-typing-dot" />
              <span className="traveally-cb-typing-dot" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
