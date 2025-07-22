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

## Deployment Options

### All-in-One (1-Click) Setup (Frontend + Backend on Same Server)

If you want to run both the backend API and the dashboard on the same server (recommended for simple setups):

1. Clone the repository and enter the project root:
   ```sh
   git clone <repo-url>
   cd asa-management
   ```
2. Run the 1-click install script (proposed, see `scripts/install-all-in-one.sh`):
   ```sh
   ./scripts/install-all-in-one.sh
   ```
   This will:
   - Install dependencies for both backend and frontend
   - Copy example env files for both
   - Build the frontend and backend
   - Start both services (backend on port 4000, frontend on port 5173 or as static files)

3. Access the dashboard at `http://localhost:5173` (or the port shown in the output).

### Advanced Setup (Separate Frontend/Backend)

If you want to run the backend and frontend on different servers or containers:

#### Backend
See [../asa-docker-control-api/README.md](../asa-docker-control-api/README.md) for backend setup instructions.

#### Frontend
1. Enter the dashboard directory:
   ```sh
   cd asa-servers-dashboard
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Copy and edit the environment file:
   ```sh
   cp env.example .env
   # Set VITE_API_BASE_URL to your backend API URL
   ```
4. Start the dashboard:
   ```sh
   npm run dev
   ```
5. Access the dashboard at the port shown in the output (default: 5173).

## Windows All-in-One Setup (PowerShell)

For Windows 10/11 users running native ARK servers, you can use the provided PowerShell script for a one-click install and launch:

1. Open PowerShell as Administrator.
2. Navigate to the dashboard scripts directory:
   ```powershell
   cd asa-servers-dashboard/scripts
   ./install-all-in-one.ps1
   ```
   Or, from the backend scripts directory:
   ```powershell
   cd asa-docker-control-api/scripts
   ./install-all-in-one.ps1
   ```
3. This will install dependencies, build the frontend, and start both backend and frontend in new windows.
4. Access the dashboard at [http://localhost:5173](http://localhost:5173) and the API at [http://localhost:4000](http://localhost:4000)

## Linux All-in-One Setup (Bash)

Linux users can use the bash script:

```bash
bash scripts/install-all-in-one.sh
```

Or use Docker Compose for containerized deployment (see `asa-docker-control-api/docker/` and documentation for details).

---

For more details, see the backend README and the documentation in the `docs/` folder.

For migration stories and debugging adventures, see the [Development Journey](../development-journey/README.md).