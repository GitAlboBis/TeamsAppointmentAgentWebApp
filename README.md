# Copilot Web Client

A modern, serverless web application that connects users to a **Microsoft Copilot Studio** agent for booking and managing appointments via natural-language chat. Built with React 19, Fluent UI, and Azure AD 

---

## ✨ What It Does

Users sign in with their Microsoft account and interact with an AI-powered Appointment Agent directly in the browser. The agent can:

- **Book, reschedule, and cancel appointments** through conversational prompts.
- **Provide real-time voice input** via Azure Speech-to-Text — just press the mic button and speak.
- **Persist chat history** locally using IndexedDB, so conversations survive page refreshes.
- **Support multiple sessions** with a sidebar for switching between active chats.
- **Adapt to light/dark mode** based on system preference or manual toggle.

---

## 🏗️ How It Works

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (SPA)                      │
│                                                         │
│  ┌──────────┐    ┌────────────────┐    ┌─────────────┐  │
│  │  Azure AD │◄──►│  React + MSAL  │◄──►│  Copilot     │  │
│  │  (Login)  │    │  (Fluent UI)   │    │  Studio SDK  │  │
│  └──────────┘    └────────────────┘    └──────┬──────┘  │
│                         │                     │         │
│                  ┌──────▼──────┐        ┌─────▼──────┐  │
│                  │  IndexedDB  │        │  Azure     │  │
│                  │  (Dexie)    │        │  Speech    │  │
│                  └─────────────┘        └────────────┘  │
└─────────────────────────────────────────────────────────┘
```

| Layer | Technology | Purpose |
|---|---|---|
| **Auth** | MSAL.js v5 (Redirect flow) | Azure AD login with PKCE, silent token refresh |
| **Chat** | `@microsoft/agents-copilotstudio-client` | Direct connection to Copilot Studio agent |
| **UI** | Fluent UI v9 + BotFramework WebChat | Themed chat interface with Fluent design tokens |
| **Speech** | Azure Cognitive Services Speech SDK | Real-time microphone → text transcription |
| **Storage** | Dexie (IndexedDB) | Offline-capable session and message persistence |
| **Bundler** | Vite 5 + TypeScript 5 | Fast dev server, optimized production builds |

---

## 📋 Prerequisites

- **Node.js** v20+
- **Azure AD App Registration** — SPA type, with redirect URI configured
- **Copilot Studio Agent** — with the "Mobile app" or "Custom website" channel enabled
- **Azure Speech Service** _(optional)_ — subscription key and region for voice input

---

## � Quick Start

```bash
# 1. Clone and install
git clone <repository-url>
cd copilot-web-client/client
npm install

# 2. Configure environment
cp .env.example .env   # Then edit with your values (see below)

# 3. Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Environment Variables

Create a `.env` file in the `client/` directory:

```env
# Azure AD Authentication
VITE_MSAL_CLIENT_ID=<your-spa-client-id>
VITE_MSAL_TENANT_ID=<your-azure-ad-tenant-id>
VITE_MSAL_REDIRECT_URI=http://localhost:5173

# Copilot Studio Agent
VITE_COPILOT_APP_CLIENT_ID=<your-copilot-app-client-id>
VITE_COPILOT_TENANT_ID=<your-copilot-tenant-id>
VITE_COPILOT_ENV_ID=<copilot-environment-id>
VITE_COPILOT_AGENT_ID=<copilot-agent-schema-name>

# Azure Speech Service (enables voice input)
VITE_SPEECH_KEY=<your-speech-subscription-key>
VITE_SPEECH_REGION=<e.g. westeurope>
```

---

## 📦 Build & Deploy

```bash
npm run build
```

The output is in `client/dist/` — a fully static bundle ready for any hosting platform:
- **Azure Static Web Apps**
- **Vercel / Netlify**
- **GitHub Pages**
- Any web server serving static files

> **Note:** Ensure your Azure AD App Registration includes the production redirect URI.

---

## 📂 Project Structure

```
client/src/
├── auth/              # MSAL config, AuthProvider, useAuth hook
├── chat/              # ChatPane, ChatInput, connection hook
├── layout/            # Header, MainLayout (sidebar + chat grid)
├── sessions/          # Session context, Dexie DB, Sidebar, SessionItem
├── shared/            # Constants (env variables)
├── speech/            # Azure Speech SDK service, MicButton, useSpeech hook
├── styles/            # Global CSS, WebChat overrides
├── theme/             # Fluent UI theme (light/dark), ThemeContext
├── App.tsx            # Root: auth gate → layout → chat
└── main.tsx           # Entry point: MSAL init → React render
```

---

## 🧪 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 5173 |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Lint with ESLint |

---

## 🔐 Authentication Flow

1. User lands on the **Login Page** (unauthenticated).
2. Clicks **"Sign in with Microsoft"** → MSAL redirect to Azure AD.
3. After login, MSAL silently acquires a Power Platform token (`https://api.powerplatform.com/.default`).
4. The token is used to initialize a direct connection to the Copilot Studio agent.
5. Tokens refresh silently in the background; interactive consent popup triggers only when needed.

---

## 📄 License

This project is private and proprietary.
