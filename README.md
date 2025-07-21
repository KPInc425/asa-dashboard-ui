# ASA Servers Dashboard

## Overview

This is the frontend dashboard for the ASA Management Suite. It provides a modern, web-based UI for managing ARK: Survival Ascended servers via the backend API.

- **Framework:** React, TypeScript
- **Features:**
  - Server status and controls
  - RCON console
  - Config file editor (Monaco Editor)
  - Real-time log streaming (Socket.IO)
  - User authentication
  - Responsive, modern UI/UX

## Setup

1. Install dependencies:
   ```sh
   npm install
   ```
2. Copy and edit the environment file:
   ```sh
   cp env.example .env
   # Edit .env as needed
   ```
3. Start the dashboard:
   ```sh
   npm run dev
   ```

## API Usage

- All API requests are sent to the backend at the URL specified in `.env` (`VITE_API_BASE_URL`).
- Uses JWT authentication for all protected routes.
- See [API_USAGE.md](./docs/API_USAGE.md) for details on API integration and error handling.

## Documentation Map

- [API Usage Guide](./docs/API_USAGE.md)
- [UI Project Guidelines](./docs/UI_PROJECT_GUIDELINES.md)
- [Development Journey](../development-journey/README.md)

## Security Notes
- JWT tokens are stored securely in memory or cookies.
- All sensitive actions require authentication.

---

For migration stories and debugging adventures, see the [Development Journey](../development-journey/README.md).