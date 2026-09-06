import React, { useState } from "react";
import { FormField } from "./types";
import { MessageSquare, ArrowRight, ShieldCheck, User } from "lucide-react";

interface LeadFormProps {
  fields: FormField[];
  title?: string;
  subtitle?: string;
  botName?: string;
  primaryColor?: string;
  onSubmit: (data: Record<string, string>) => void;
  isLoading?: boolean;
}

export const LeadForm: React.FC<LeadFormProps> = ({
  fields,
  title = "Start a Conversation",
  subtitle = "Please introduce yourself so our travel team can best assist you.",
  botName = "Traveally Assistant",
  primaryColor = "#00B4BA",
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeFields = fields.filter((f) => f.enabled !== false);

  const handleChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    activeFields.forEach((field) => {
      const val = (formData[field.id] || "").trim();
      if (field.required && !val) {
        newErrors[field.id] = `${field.label} is required`;
      } else if (field.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        newErrors[field.id] = "Please enter a valid email";
      } else if (field.type === "tel" && val && val.length < 8) {
        newErrors[field.id] = "Please enter a valid phone number";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="traveally-cb-leadform-wrap" style={{ padding: "20px 18px", display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}>
      <div style={{ textAlign: "center", marginBottom: "18px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "var(--traveally-cb-bot-bubble, #f1f5f9)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: primaryColor,
            marginBottom: "10px",
          }}
        >
          <MessageSquare size={22} />
        </div>
        <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700, color: "var(--traveally-cb-text)" }}>
          {title}
        </h3>
        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--traveally-cb-text-muted)", lineHeight: 1.4 }}>
          {subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        {activeFields.map((field) => (
          <div key={field.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--traveally-cb-text)" }}>
              {field.label} {field.required && <span style={{ color: "#ef4444" }}>*</span>}
            </label>
            <input
              type={field.type || "text"}
              placeholder={field.placeholder || `Enter your ${field.label.toLowerCase()}`}
              value={formData[field.id] || ""}
              onChange={(e) => handleChange(field.id, e.target.value)}
              disabled={isLoading}
              style={{
                padding: "9px 12px",
                borderRadius: "8px",
                border: errors[field.id] ? "1px solid #ef4444" : "1px solid var(--traveally-cb-border, #cbd5e1)",
                background: "var(--traveally-cb-bg, #ffffff)",
                fontSize: "13px",
                color: "var(--traveally-cb-text)",
                outline: "none",
                boxSizing: "border-box",
                width: "100%",
              }}
            />
            {errors[field.id] && (
              <span style={{ fontSize: "11px", color: "#ef4444" }}>{errors[field.id]}</span>
            )}
          </div>
        ))}

        <div style={{ marginTop: "auto", paddingTop: "14px" }}>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "11px 16px",
              borderRadius: "10px",
              background: "var(--traveally-cb-primary-gradient, #00b4ba)",
              color: "#ffffff",
              border: "none",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(0, 180, 186, 0.3)",
              transition: "opacity 0.2s",
            }}
          >
            <span>{isLoading ? "Connecting..." : "Start Chatting"}</span>
            {!isLoading && <ArrowRight size={15} />}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "11px",
              color: "var(--traveally-cb-text-muted)",
              marginTop: "10px",
            }}
          >
            <ShieldCheck size={13} style={{ color: "#22c55e" }} />
            <span>Direct agent response • Your details are private</span>
          </div>
        </div>
      </form>
    </div>
  );
};
