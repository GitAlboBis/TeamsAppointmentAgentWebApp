# Copilot Web Client

> Custom React-based chat client for the Teams Appointment Agent (Copilot Studio).

## Architecture

- **`client/`** — React 19 + Vite + TypeScript frontend
- **`server/`** — Node.js / Express backend middleware

See [PRD.md](../PRD.md) and [code-organization.md](../code-organization.md) for full documentation.

## Prerequisites

- Node.js 20+
- Azure AD App Registrations (Frontend SPA + Backend API)
- Azure Cognitive Services (Speech)
- Bot Framework Direct Line channel configured

## Quick Start

```bash
# Install dependencies
cd client && npm install
cd ../server && npm install

# Configure environment
cp server/.env.example server/.env
# Fill in your Azure AD, Direct Line, and Speech credentials

# Run development servers
cd client && npm run dev    # http://localhost:5173
cd server && npm run dev    # http://localhost:3001
```

## Scripts

| Package  | Script    | Description                        |
|----------|-----------|------------------------------------|
| `client` | `dev`     | Vite dev server with HMR           |
| `client` | `build`   | Type-check + production bundle     |
| `client` | `preview` | Serve production build locally     |
| `client` | `test`    | Run Vitest unit/integration tests  |
| `server` | `dev`     | Express server with auto-reload    |
| `server` | `build`   | Compile TypeScript to `dist/`      |
| `server` | `start`   | Run compiled server                |
| `server` | `test`    | Run Vitest backend tests           |
