import React from "react";
import { QuickPrompt } from "./types";
import { Sparkles } from "lucide-react";

interface QuickPromptsProps {
  prompts: QuickPrompt[];
  onSelect: (message: string) => void;
  disabled?: boolean;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ prompts, onSelect, disabled }) => {
  if (!prompts || prompts.length === 0) return null;

  return (
    <div className="traveally-cb-prompts-wrap" role="group" aria-label="Suggested questions">
      {prompts.map((prompt) => (
        <button
          key={prompt.id}
          type="button"
          className="traveally-cb-prompt-chip"
          disabled={disabled}
          onClick={() => onSelect(prompt.message || prompt.label)}
        >
          <Sparkles size={12} style={{ color: "var(--traveally-cb-primary)" }} />
          <span>{prompt.label}</span>
        </button>
      ))}
    </div>
  );
};
