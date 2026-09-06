import React from "react";
import { createRoot } from "react-dom/client";
import { TraveallyChatbot } from "./TraveallyChatbot";
import { TraveallyChatbotConfig } from "./types";

export * from "./types";
export * from "./security";
export * from "./api";
export * from "./ChatbotContext";
export * from "./MessageList";
export * from "./QuickPrompts";
export * from "./TraveallyChatbot";

/**
 * Imperative programmatic helper to initialize and mount the Traveally Chatbot
 * into any DOM container or automatically attach to document.body.
 */
export function initChatbot(
  config: TraveallyChatbotConfig = {},
  targetElementId?: string
): { unmount: () => void } {
  if (typeof document === "undefined") {
    return { unmount: () => {} };
  }

  let container: HTMLElement | null = null;

  if (targetElementId) {
    container = document.getElementById(targetElementId);
  }

  if (!container) {
    const defaultId = "traveally-chatbot-root";
    let existing = document.getElementById(defaultId);
    if (!existing) {
      existing = document.createElement("div");
      existing.id = defaultId;
      document.body.appendChild(existing);
    }
    container = existing;
  }

  const root = createRoot(container);
  root.render(React.createElement(TraveallyChatbot, { config }));

  return {
    unmount: () => {
      root.unmount();
      container?.remove();
    },
  };
}

export default TraveallyChatbot;
