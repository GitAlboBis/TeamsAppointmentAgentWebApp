# Copilot Web Client

A modern, standalone React 19 frontend for interacting with Microsoft Copilot Studio agents. This application uses a client-only architecture with direct integration to Copilot Studio via Direct Line and Azure AD authentication.

## 🚀 Features

- **Framework**: React 19, Vite, TypeScript.
- **UI Component Library**: Fluent UI React Components (v9).
- **Authentication**: Secure client-side authentication using MSAL (`@azure/msal-react`) with Redirect flow.
- **Chat Integration**: Direct connection to Copilot Studio using `@microsoft/agents-copilotstudio-client`.
- **Speech**: Integrated Speech-to-Text using Azure Cognitive Services.
- **Architecture**: Single Page Application (SPA) - No middleware server required.

## 📋 Prerequisites

- **Node.js**: v20 or higher.
- **Copilot Studio Agent**: An agent created in Copilot Studio with the "Mobile app" or "Custom website" channel enabled.
- **Azure App Registration**:
  - Registered as a **Single Page Application (SPA)**.
  - Redirect URI configured (e.g., `http://localhost:5173`).
  - API Permissions for accessing the agent (if applicable).
- **Azure Speech Service** (Optional): Key and Region for speech capabilities.

## 🛠️ Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd copilot-web-client
    ```

2.  **Navigate to the client directory**:
    The entire application lives in the `client` folder.
    ```bash
    cd client
    ```

3.  **Install dependencies**:
    ```bash
    npm install
    ```

4.  **Configure Environment Variables**:
    Create a `.env` file in the `client` directory based on the example below:

    ```env
    # --- Vite Server ---
    VITE_PORT=5173

    # --- MSAL / Azure AD Authentication ---
    VITE_MSAL_CLIENT_ID=<your-spa-client-id>
    VITE_MSAL_TENANT_ID=<your-tenant-id>
    VITE_MSAL_REDIRECT_URI=http://localhost:5173

    # --- Copilot Studio Agent Details ---
    VITE_COPILOT_APP_CLIENT_ID=<your-copilot-app-id>
    VITE_COPILOT_TENANT_ID=<your-tenant-id>
    VITE_COPILOT_ENV_ID=<environment-id>
    VITE_COPILOT_AGENT_ID=<agent-id>

    # --- Azure Speech Service (Optional) ---
    VITE_SPEECH_KEY=<your-speech-key>
    VITE_SPEECH_REGION=<your-speech-region>
    ```

5.  **Run the development server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🏗️ Build & Deploy

To create a production build:

```bash
npm run build
```

The output will be in the `dist` directory, ready to be deployed to any static site host (Azure Static Web Apps, Vercel, Netlify, etc.).

## 📂 Project Structure

```
copilot-web-client/
└── client/                # Main application source
    ├── public/            # Static assets
    ├── src/
    │   ├── auth/          # MSAL configuration and AuthProvider
    │   ├── chat/          # Chat interface and Direct Line logic
    │   ├── components/    # Reusable UI components
    │   ├── services/      # Service integrations
    │   ├── shared/        # Constants and types
    │   ├── styles/        # Global styles and themes
    │   ├── utils/         # Helper functions
    │   ├── App.tsx        # Main App component
    │   └── main.tsx       # Entry point
    ├── index.html         # HTML template
    ├── package.json       # Dependencies and scripts
    └── vite.config.ts     # Vite configuration
```

## 🤝 Contributing

1.  Navigate to `client/`.
2.  Run `npm run lint` to check for code style issues.
3.  Run `npm test` to execute unit tests.
