import React, { useState } from "react";
import { FormField } from "./types";
import { MessageSquare, ArrowRight } from "lucide-react";

interface LeadFormProps {
  fields: FormField[];
  title?: string;
  subtitle?: string;
  botName?: string;
  icon?: string | null;
  primaryColor?: string;
  onSubmit: (data: Record<string, string>) => void;
  isLoading?: boolean;
}

export const LeadForm: React.FC<LeadFormProps> = ({
  fields,
  title,
  subtitle,
  botName = "Travel Concierge",
  icon = null,
  primaryColor = "#022247",
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
    <div
      className="traveally-cb-leadform-wrap"
      style={{
        padding: "18px 18px 0 18px",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        boxSizing: "border-box",
        background: "#ffffff",
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        {activeFields.map((field) => (
          <div key={field.id} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--traveally-cb-text, #1e293b)" }}>
              {field.label} {field.required && <span style={{ color: "#ef4444" }}>*</span>}
            </label>
            <input
              type={field.type || "text"}
              placeholder={field.placeholder || `Enter your ${field.label.toLowerCase()}`}
              value={formData[field.id] || ""}
              onChange={(e) => handleChange(field.id, e.target.value)}
              disabled={isLoading}
              style={{
                padding: "10px 13px",
                borderRadius: "8px",
                border: errors[field.id] ? "1.5px solid #ef4444" : "1px solid #e2e8f0",
                background: "#ffffff",
                fontSize: "13px",
                color: "#1e293b",
                outline: "none",
                boxSizing: "border-box",
                width: "100%",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
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
              padding: "12px 18px",
              borderRadius: "10px",
              background: "var(--traveally-cb-primary, #022247)",
              color: "#ffffff",
              border: "none",
              fontSize: "14px",
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(2, 34, 71, 0.2)",
              transition: "opacity 0.2s, transform 0.1s",
            }}
          >
            <span>{isLoading ? "Connecting..." : "Start Chatting"}</span>
            {!isLoading && <ArrowRight size={15} />}
          </button>

          <div className="traveally-cb-powered-by">
            <span>Powered By </span>
            <a href="https://traveally.com" target="_blank" rel="noopener noreferrer">
              Traveally.com
            </a>
          </div>
        </div>
      </form>
    </div>
  );
};
