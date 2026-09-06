# @traveally

Official React client library and SDK for Traveally platform services, featuring secure conversational AI chatbot widgets, dynamic branding, and multi-tenant integrations.

## Features

- **Subpath Module Architecture**: Import the chatbot via `@traveally/chatbot` (or typo-alias `@traveally/chabot`), with room for additional platform modules under `@traveally`.
- **Dynamic Backend Branding**: Automatically queries `https://backend.traveally.com/api/dashboard/public/resolve/:domain` to fetch the organization's verified logo, name, and icon in real-time.
- **Config-Driven Color Scheme**: Fully customizable theme system (`primaryColor`, `secondaryColor`, `accentColor`, `userBubbleColor`, `botBubbleColor`, `borderRadius`, `mode`) mapped directly to CSS variables.
- **Enterprise Security**:
  - **XSS Protection**: Sanitizes messages and links; neutralizes `<script>`, `iframe`, `onload`, `onerror`, and dangerous URL schemes.
  - **Cryptographic Session Isolation**: Unguessable session tokens generated via `crypto.randomUUID` with resilient entropy fallback.
  - **Anti-Flooding Rate Limiter**: Client-side sliding-window throttle preventing bot abuse and spam.
  - **Safe Headers**: Sends `x-org-domain`, `x-session-id`, and `x-traveally-client` for multi-tenant backend isolation.
- **Flexible UI**: Floating glassmorphic docked widget with badge, or seamless embedded `inline` mode.
- **React 18 & 19 Ready**: Dual ESM + CommonJS bundles with full TypeScript `.d.ts` definitions.

---

## Installation

```bash
npm install @traveally lucide-react
# or
bun add @traveally lucide-react
```

---

## Quick Start

### 1. Import Component & Styles

```tsx
import React from "react";
import { TraveallyChatbot } from "@traveally/chatbot";
import "@traveally/chatbot/styles.css";

export default function App() {
  return (
    <div>
      <h1>Welcome to My Travel Website</h1>

      {/* Floating Chatbot Widget */}
      <TraveallyChatbot
        config={{
          domain: "travelyaan.com", // Organization domain for backend branding resolution
          backendUrl: "https://backend.traveally.com",
          theme: {
            primaryColor: "#00B4BA",
            secondaryColor: "#011531",
            borderRadius: "18px",
          },
        }}
      />
    </div>
  );
}
```

---

## Configuration Reference

Pass the `config` object to `<TraveallyChatbot config={...} />`:

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `domain` | `string` | `window.location.hostname` | Organization domain used by `backend.traveally.com` to resolve tenant logo and info. |
| `backendUrl` | `string` | `"https://backend.traveally.com"` | Traveally backend API endpoint. |
| `title` | `string` | `branding.name` | Chat header title (defaults to company name fetched from backend). |
| `subtitle` | `string` | `"AI Travel Concierge • Online"` | Header status text. |
| `welcomeMessage` | `string` | Auto-generated | Greeting displayed to visitors. |
| `logoUrl` | `string` | Auto-fetched | Manual logo override (otherwise fetched from backend). |
| `position` | `"bottom-right" \| "bottom-left"` | `"bottom-right"` | Screen placement for floating launcher button. |
| `variant` | `"floating" \| "inline"` | `"floating"` | Floating widget or embedded container mode. |
| `theme` | `ChatbotTheme` | `{}` | Theme color scheme customization. |
| `quickPrompts` | `QuickPrompt[]` | Default prompts | Suggestion pill chips displayed in conversation. |
| `defaultOpen` | `boolean` | `false` | Initial open state on mount. |
| `rateLimitMaxPerMinute` | `number` | `20` | Max messages allowed per minute before throttling. |
| `customerToken` | `string` | `undefined` | JWT/Bearer token for authenticated travelers. |
| `traveler` | `object` | `{}` | Pre-populated `{ name, email, phone }` for lead capture. |
| `onSendMessage` | `function` | `undefined` | Custom transport override to hook custom AI models. |
| `onBrandingLoaded`| `function` | `undefined` | Callback fired when backend resolves organization logo and details. |

---

## Config-Based Color Scheme (`theme`)

```tsx
<TraveallyChatbot
  config={{
    domain: "traveally.com",
    theme: {
      primaryColor: "#00B4BA",         // Brand header and send button
      secondaryColor: "#011531",       // Header background and dark accents
      accentColor: "#C0FBFF",          // Prompt chip active highlight
      backgroundColor: "#ffffff",      // Chat window background
      botBubbleColor: "#F1F5F9",       // Bot speech bubble color
      botTextColor: "#0F172A",         // Bot speech text color
      userBubbleColor: "#00B4BA",      // Traveler speech bubble color
      userTextColor: "#FFFFFF",        // Traveler speech text color
      borderRadius: "20px",            // Corner radius
      mode: "light",                   // "light" | "dark" | "auto"
    },
  }}
/>
```

---

## Dynamic Backend Logo Resolution

When you specify `domain: "traveally.com"`, the library automatically requests:
```http
GET https://backend.traveally.com/api/dashboard/public/resolve/traveally.com
```

The response payload:
```json
{
  "success": true,
  "data": {
    "name": "Traveally",
    "logo": "https://backend.traveally.com/logo.png",
    "icon": "https://backend.traveally.com/icon.png",
    "org_id": "DNBYLJ_08QXQTEBX4SBHTFSG",
    "is_platform": true
  }
}
```
The chatbot extracts `logo` and dynamically injects it into:
1. Floating launcher trigger icon.
2. Chat window header avatar.
3. Bot speech bubble avatars.

---

## Programmatic Hook: `useTraveallyChatbot`

For custom triggers or UI integration:

```tsx
import React from "react";
import { TraveallyChatbotProvider, useTraveallyChatbot } from "@traveally/chatbot";

function CustomChatButton() {
  const { toggle, isOpen, branding } = useTraveallyChatbot();

  return (
    <button onClick={toggle}>
      {isOpen ? "Close Concierge" : `Chat with ${branding?.name || "Us"}`}
    </button>
  );
}

export default function App() {
  return (
    <TraveallyChatbotProvider config={{ domain: "travelyaan.com" }}>
      <CustomChatButton />
    </TraveallyChatbotProvider>
  );
}
```

---

## Standalone DOM Initialization

If you want to mount the chatbot without JSX or in plain JavaScript:

```ts
import { initChatbot } from "@traveally/chatbot";
import "@traveally/chatbot/styles.css";

const instance = initChatbot({
  domain: "traveally.com",
  theme: { primaryColor: "#00B4BA" }
});

// To cleanup / unmount:
// instance.unmount();
```

## Public Website API Client (`@traveally` or `@traveally/api`)

The library includes a complete TypeScript API client to build custom travel websites, customer portals, checkout flows, and review sections:

```tsx
import { TraveallyClient, TraveallyProvider, useTraveally } from "@traveally";

// Initialize client directly
const client = new TraveallyClient({
  domain: "myagency.com",
  baseUrl: "https://backend.traveally.com"
});

// 1. Fetch tour packages
const packages = await client.packages.getAll();
const packageDetails = await client.packages.getBySlug("5-day-bali-escape");

// 2. Thematic collections & activities
const collections = await client.collections.getAll();
const activities = await client.activities.getAll();

// 3. Customer authentication & sign in
const authSession = await client.auth.login({
  email: "traveler@example.com",
  password: "SecurePassword123"
});

// 4. Inquiries & custom lead submissions
await client.forms.submitLead({
  name: "Sarah Jenkins",
  email: "sarah.j@outlook.com",
  phone: "+44 7700 900123",
  destination: "Ladakh & Kashmir",
  pax: 2
});

// 5. Customer verified reviews
const reviews = await client.reviews.getAll();

// 6. Payment order creation
const order = await client.payments.createOrder({
  package_id: "pkg_123",
  amount: 145000,
  currency: "INR",
  customer_name: "Rahul Verma",
  customer_email: "rahul@gmail.com",
  customer_phone: "+919811234567"
});
```

### React Hooks Integration (`<TraveallyProvider>`)

Wrap your application to access authentication state and API methods across any component:

```tsx
import { TraveallyProvider, useTraveally } from "@traveally";

function UserProfile() {
  const { currentUser, isAuthenticated, logout } = useTraveally();

  if (!isAuthenticated) {
    return <a href="/login">Sign In</a>;
  }

  return (
    <div>
      <p>Welcome back, {currentUser?.full_name}!</p>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}

export default function App() {
  return (
    <TraveallyProvider domain="travelyaan.com">
      <UserProfile />
    </TraveallyProvider>
  );
}
```

---

## License

MIT © Traveally

