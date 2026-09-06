import { describe, it, expect } from "bun:test";
import * as rootExport from "../src/index";
import * as chatbotExport from "../src/chatbot/index";
import * as apiExport from "../src/api/index";

describe("Library Modular Exports", () => {
  it("exports Chatbot components and utilities from root @traveally", () => {
    expect(rootExport.TraveallyChatbot).toBeDefined();
    expect(rootExport.TraveallyChatbotProvider).toBeDefined();
    expect(rootExport.useTraveallyChatbot).toBeDefined();
    expect(rootExport.initChatbot).toBeDefined();
    expect(rootExport.ChatbotModule).toBeDefined();
  });

  it("exports Public API Client & React tools from root @traveally", () => {
    expect(rootExport.TraveallyClient).toBeDefined();
    expect(rootExport.TraveallyProvider).toBeDefined();
    expect(rootExport.useTraveally).toBeDefined();
    expect(rootExport.createTraveallyClient).toBeDefined();
    expect(rootExport.ApiModule).toBeDefined();
  });

  it("exports dedicated chatbot subpath symbols from src/chatbot", () => {
    expect(chatbotExport.TraveallyChatbot).toBeDefined();
    expect(chatbotExport.initChatbot).toBeDefined();
    expect(chatbotExport.generateSecureSessionId).toBeDefined();
    expect(chatbotExport.sanitizeMessageContent).toBeDefined();
    expect(chatbotExport.ClientRateLimiter).toBeDefined();
  });

  it("exports dedicated api subpath symbols from src/api", () => {
    expect(apiExport.TraveallyClient).toBeDefined();
    expect(apiExport.TraveallyProvider).toBeDefined();
    expect(apiExport.useTraveally).toBeDefined();
    expect(apiExport.createTraveallyClient).toBeDefined();
  });
});
