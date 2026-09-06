/**
 * @traveally/chatbot Types
 */

export type ChatbotThemeMode = "light" | "dark" | "auto";
export type ChatbotPosition = "bottom-right" | "bottom-left";
export type ChatbotVariant = "floating" | "inline";

export interface ChatbotTheme {
  /** Primary brand color (headers, user message bubbles, send button). Default: #00B4BA */
  primaryColor?: string;
  /** Secondary dark color (subtle backgrounds, contrast accents). Default: #011531 */
  secondaryColor?: string;
  /** Accent highlight color (hover states, active badges). Default: #C0FBFF */
  accentColor?: string;
  /** Chat window background color */
  backgroundColor?: string;
  /** Default body text color */
  textColor?: string;
  /** Bot message bubble background color */
  botBubbleColor?: string;
  /** Bot message text color */
  botTextColor?: string;
  /** User message bubble background color */
  userBubbleColor?: string;
  /** User message text color */
  userTextColor?: string;
  /** Widget rounded corner radius in pixels or css unit (e.g. "16px"). Default: "16px" */
  borderRadius?: string;
  /** Custom font family */
  fontFamily?: string;
  /** Color theme mode: light, dark, or auto (system preference) */
  mode?: ChatbotThemeMode;
}

export interface OrganizationBranding {
  name: string;
  logo: string | null;
  icon?: string | null;
  org_id?: string;
  is_platform?: boolean;
  banners?: any;
}

export interface FormField {
  id: string;
  label: string;
  type?: "text" | "email" | "tel";
  required?: boolean;
  enabled?: boolean;
  placeholder?: string;
}

export interface QuickPrompt {
  id: string;
  label: string;
  message?: string;
  icon?: string;
}

export interface ChatMessageMetadata {
  type?: "package" | "quote" | "inquiry" | "link" | "card";
  title?: string;
  url?: string;
  price?: string | number;
  currency?: string;
  imageUrl?: string;
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  sender: "bot" | "user" | "agent" | "system";
  text: string;
  senderName?: string;
  avatarUrl?: string;
  createdAt: string;
  status?: "sending" | "sent" | "error";
  metadata?: ChatMessageMetadata;
}

export interface TraveallyChatbotConfig {
  /**
   * Organization domain used to identify the tenant and fetch official branding & logo.
   * Defaults to window.location.hostname or "traveally.com".
   */
  domain?: string;

  /**
   * Backend base URL for Traveally API services.
   * Defaults to "https://backend.traveally.com".
   */
  backendUrl?: string;

  /**
   * Title shown at the top of the chatbot window.
   * If omitted, dynamically filled with the organization name from the backend.
   */
  title?: string;

  /**
   * Subtitle / status text in the header.
   * Defaults to "AI Travel Concierge • Online".
   */
  subtitle?: string;

  /**
   * Welcome message automatically greeted to the visitor.
   */
  welcomeMessage?: string;

  /**
   * Fallback or explicit logo URL.
   * If not provided, dynamically fetched from backend.traveally.com/api/dashboard/public/resolve/:domain.
   */
  logoUrl?: string;

  /**
   * Short logo / icon / monogram URL for avatar badges and headers.
   * Automatically defaults to backend resolved icon.
   */
  iconUrl?: string;
  shortLogoUrl?: string;

  /**
   * Bot avatar URL override.
   */
  avatarUrl?: string;

  /**
   * Visual theme and color scheme configuration.
   */
  theme?: ChatbotTheme;

  /**
   * Widget placement on the screen: 'bottom-right' (default) or 'bottom-left'.
   */
  position?: ChatbotPosition;

  /**
   * Display mode: 'floating' (docked launcher button) or 'inline' (embedded in page container).
   */
  variant?: ChatbotVariant;

  /**
   * Suggested quick reply prompts displayed to travelers.
   */
  quickPrompts?: QuickPrompt[];

  /**
   * Initial open state on component mount. Default: false.
   */
  defaultOpen?: boolean;

  /**
   * Custom customer auth token or API key if the traveler is logged in.
   */
  customerToken?: string;

  /**
   * Flag indicating if the current traveler is already authenticated.
   * If true, the visitor skips the lead capture form completely.
   */
  isAuthenticated?: boolean;

  /**
   * Whether unauthenticated visitors must fill the lead capture form before chatting.
   * If omitted, dynamically loaded from organization settings on backend.traveally.com.
   */
  requireLeadForm?: boolean;

  /**
   * Custom list of fields for the lead capture form.
   */
  formFields?: FormField[];

  /**
   * Callback fired when unauthenticated visitor completes the lead form.
   */
  onLeadSubmitted?: (traveler: { name?: string; email?: string; phone?: string; [key: string]: any }) => void;

  /**
   * Pre-identified traveler information.
   */
  traveler?: {
    name?: string;
    email?: string;
    phone?: string;
    userId?: string;
  };

  /**
   * Rate limiting throttle: max messages per minute per session. Default: 20.
   */
  rateLimitMaxPerMinute?: number;

  /**
   * Enable sound effect on incoming messages. Default: false.
   */
  soundEnabled?: boolean;

  /**
   * Custom message sender override if user wants custom AI transport.
   */
  onSendMessage?: (
    message: string,
    context: { sessionId: string; domain: string }
  ) => Promise<{ reply: string; metadata?: ChatMessageMetadata } | string>;

  /**
   * Callback fired when chatbot opens or closes.
   */
  onToggle?: (isOpen: boolean) => void;

  /**
   * Callback fired when organization branding is resolved.
   */
  onBrandingLoaded?: (branding: OrganizationBranding) => void;
}

export interface ChatbotContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
  isLoading: boolean;
  isTyping: boolean;
  isAgentTyping: boolean;
  activeAgentName?: string;
  branding: OrganizationBranding | null;
  config: TraveallyChatbotConfig;
  sessionId: string;
  conversationId?: string;
  activeError: string | null;
  clearError: () => void;
  isLeadFormNeeded: boolean;
  formFields: FormField[];
  submitLead: (formData: Record<string, string>) => Promise<void>;
  travelerData: Record<string, any>;
}
