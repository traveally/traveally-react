import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { TraveallyChatbot, ChatbotTheme, OrganizationBranding } from "../src/chatbot";
import "../src/chatbot/chatbot.css";

function DemoApp() {
  const [domain, setDomain] = useState("travelyaan.com");
  const [primaryColor, setPrimaryColor] = useState("#022247");
  const [secondaryColor, setSecondaryColor] = useState("#011531");
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [variant, setVariant] = useState<"floating" | "inline">("floating");
  const [brandingInfo, setBrandingInfo] = useState<OrganizationBranding | null>(null);

  const theme: ChatbotTheme = {
    primaryColor,
    secondaryColor,
    mode,
    borderRadius: "16px",
  };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "sans-serif", background: mode === "dark" ? "#0f172a" : "#f8fafc", color: mode === "dark" ? "#f1f5f9" : "#1e293b", padding: "30px 20px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <header style={{ borderBottom: "1px solid rgba(0,0,0,0.1)", paddingBottom: "20px", marginBottom: "30px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "28px" }}>🚀</span>
            <div>
              <h1 style={{ margin: 0, fontSize: "24px" }}>@traveally/react Interactive Playground</h1>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
                Connected to <code>https://backend.traveally.com</code> • Real-time branding resolution & concierge testing
              </p>
            </div>
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: variant === "inline" ? "1fr 1fr" : "1fr", gap: "24px", alignItems: "start" }}>
          {/* Controls Panel */}
          <div style={{ background: mode === "dark" ? "#1e293b" : "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "18px", marginTop: 0 }}>🎛️ Live Configuration</h2>

            {/* Domain */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                Organization Domain (for backend branding lookup)
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
              />
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Queries: <code>https://backend.traveally.com/api/dashboard/public/resolve/{domain}</code>
              </span>
            </div>

            {/* Colors */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "18px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                  Primary Color
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ width: "40px", height: "36px", border: "none", borderRadius: "6px", cursor: "pointer" }}
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ width: "100px", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                  Secondary Color
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    style={{ width: "40px", height: "36px", border: "none", borderRadius: "6px", cursor: "pointer" }}
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    style={{ width: "100px", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>
            </div>

            {/* Preset Color Themes */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
                Quick Theme Palettes
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => { setPrimaryColor("#00B4BA"); setSecondaryColor("#011531"); }}
                  style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #00B4BA", background: "#00B4BA", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                >
                  Traveally Cyan
                </button>
                <button
                  type="button"
                  onClick={() => { setPrimaryColor("#2563eb"); setSecondaryColor("#0f172a"); }}
                  style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #2563eb", background: "#2563eb", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                >
                  Royal Blue
                </button>
                <button
                  type="button"
                  onClick={() => { setPrimaryColor("#059669"); setSecondaryColor("#064e3b"); }}
                  style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #059669", background: "#059669", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                >
                  Emerald Palm
                </button>
                <button
                  type="button"
                  onClick={() => { setPrimaryColor("#ea580c"); setSecondaryColor("#431407"); }}
                  style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #ea580c", background: "#ea580c", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                >
                  Sunset Orange
                </button>
              </div>
            </div>

            {/* Mode & Variant */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "18px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Theme Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Display Mode</label>
                <select
                  value={variant}
                  onChange={(e) => setVariant(e.target.value as any)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="floating">Floating Launcher</option>
                  <option value="inline">Inline Embedded</option>
                </select>
              </div>
            </div>

            {/* Backend Resolved Data Banner */}
            <div style={{ background: mode === "dark" ? "#0f172a" : "#f1f5f9", padding: "14px", borderRadius: "10px", marginTop: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: "8px" }}>
                Backend Resolved Status
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {brandingInfo?.logo ? (
                  <img src={brandingInfo.logo} alt="Resolved Logo" style={{ width: "36px", height: "36px", objectFit: "contain", borderRadius: "6px", background: "#fff", padding: "2px" }} />
                ) : (
                  <span style={{ fontSize: "24px" }}>🏢</span>
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>
                    {brandingInfo?.name || "Resolving domain..."}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Logo URL: {brandingInfo?.logo || "Using default"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inline Chat Container (if variant="inline") */}
          {variant === "inline" && (
            <div style={{ height: "600px", borderRadius: "16px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
              <TraveallyChatbot
                key={`${domain}-${primaryColor}-${secondaryColor}-${mode}-${variant}`}
                config={{
                  domain,
                  backendUrl: "https://backend.traveally.com",
                  theme,
                  variant: "inline",
                  defaultOpen: true,
                  onBrandingLoaded: (brand) => setBrandingInfo(brand),
                }}
              />
            </div>
          )}
        </div>

        {/* Floating Chatbot (if variant="floating") */}
        {variant === "floating" && (
          <TraveallyChatbot
            key={`${domain}-${primaryColor}-${secondaryColor}-${mode}-${variant}`}
            config={{
              domain,
              backendUrl: "https://backend.traveally.com",
              theme,
              variant: "floating",
              defaultOpen: true,
              onBrandingLoaded: (brand) => setBrandingInfo(brand),
            }}
          />
        )}
      </div>
    </div>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<DemoApp />);
}
