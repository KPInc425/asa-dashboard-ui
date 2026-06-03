# Game Estate Dashboard

## Overview

Multi-environment management dashboard for the ILGaming game server estate. Supports multiple backend APIs hosted remotely or locally, with typed commands, capability-driven UI, and a canonical inventory of all services.

- **Framework:** React, TypeScript, Vite
- **Styling:** Tailwind CSS, daisyUI
- **Build Status:** ✅ **Production Ready** - All TypeScript errors resolved
- **Features:**
  - Multi-environment shell (switch between ASA remote, local estate, etc.)
  - Server status and controls
  - RCON console
  - Config file editor (Monaco Editor)
  - Real-time log streaming (Socket.IO)
  - User authentication (per-backend)
  - Server provisioning wizard
  - Cluster management
  - Backup and restore operations
  - Mod management
  - Backend adapter system for multi-API support
  - Capability-driven UI (features hide when backend doesn't support them)
  - Typed commands with risk-level confirmation

## Local Development Setup

### Prerequisites
- Node.js 18+
- Access to a running backend API (see below)

### Quick Start

```sh
npm install
cp env.example .env
# Edit .env: set VITE_API_BASE_URL to your backend API URL
npm run dev
```

### Connecting to a backend

The dashboard ships with two environments pre-configured in `src/config/environments.ts`:

| Environment | Backend | Behavior |
|---|---|---|
| `env:asa-remote` | Your remote ASA API | Full control (start/stop/RCON/config)
| `env:ilgaming-prod` | None (read-only) | Deep links to Homepage/Uptime Kuma/Dozzle |

Set `VITE_API_BASE_URL` in `.env` or leave it blank and use the environment switcher in the sidebar.

### Adding a new environment

Edit `src/config/environments.ts` and add a new entry following the `EnvironmentConfig` interface from `src/types/environment.ts`.

### Architecture overview

```
Pages (Dashboard, Servers, etc.)
  |
  v
Adapter Registry (resolves adapter for current environment's backend)
  |
  +-- ASAAdapter (talks to asa-control-api REST + Socket.IO)
  +-- DeployctlAdapter (talks to deployctl.sh on host - stub)
  +-- NoOpAdapter (graceful degradation when no backend)
  |
EnvironmentContext / AuthContext (per-backend auth, env switching)
```

## Key Files

| File | Purpose |
|------|---------|
| `src/config/environments.ts` | Environment definitions (add new backends here) |
| `src/contexts/EnvironmentContext.tsx` | Environment state, switching, capability resolution |
| `src/contexts/AuthContext.tsx` | Per-backend auth tracking, backward compatible |
| `src/adapters/asa-adapter.ts` | ASA backend adapter (maps ~80 API endpoints) |
| `src/adapters/adapter-registry.ts` | Adapter factory and singleton registry |
| `src/adapters/capabilities.ts` | Static capability manifests for known backend types |
| `src/adapters/deployctl-adapter.ts` | Full deployctl.sh adapter for local backends |
| `src/hooks/useInventoryServices.ts` | Adapter-driven hooks consuming `ServiceEntry` |
| `src/hooks/useScopedAdapter.ts` | Scoped adapter hook with query key factory |
| `src/utils/environmentRoutes.ts` | Environment-aware routing utilities |
| `src/components/EnvAwareRouter.tsx` | Auto-switches env on `/env/:envId/...` routes |
| `src/components/EnvAwareLayout.tsx` | Layout wrapper for env-aware routes |
| `src/types/commands.ts` | Typed command model with risk levels |
| `src/config/commands.ts` | Command registry (restart, stop, backup, etc.) |
| `src/components/EnvironmentSwitcher.tsx` | daisyUI dropdown for env switching |
| `src/components/ActionButton.tsx` | Risk-aware action button with confirmation |

## Completed Work (June 2026)

The following items from the deferred list have been implemented:

1. **✅ Inventory-driven pages** — `src/hooks/useInventoryServices.ts` provides adapter-driven hooks (`useServices`, `useService`) that consume `ServiceEntry` from the adapter with backward-compatible fallback to direct API calls. `Servers.tsx` now uses the adapter as the primary data source.

2. **✅ Environment-aware routing** — Routes now support `/env/:envId/...` URL prefixes via `EnvAwareRouter`/`EnvAwareLayout`. The `Sidebar` and `EnvironmentSwitcher` use env-aware links when in env mode. Legacy flat routes remain fully functional.

3. **✅ DeployctlAdapter** — Full implementation with shell calls to `deployctl.sh`, proper ServiceEntry mapping, action execution, log parsing, and automatic Node.js environment detection with graceful browser fallback.

4. **✅ Playwright MCP tests** — Test configuration and regression test suite in `.playwright-mcp/` covering navigation, env-aware routing, and accessibility.

## Remaining Work (deferred)

These items are designed and documented in `automation/docs/plans/` but not yet implemented:

1. **Inventory-driven pages** — Refactor `Servers.tsx`/`ServerDetails.tsx` to consume `ServiceEntry` from the adapter instead of hardcoded ASA endpoints
2. **Environment-aware routing** — Add `/env/:envId/...` URL prefixes for direct bookmarking
3. **DeployctlAdapter** — Full implementation when local backend hosting is desired
4. **Playwright MCP tests** — Regression tests before production deploy

## Recent Updates (June 2026)

- ✅ **Multi-environment shell** — EnvironmentContext, switcher, env config
- ✅ **Backend adapter system** — ASAAdapter, NoOpAdapter, AdapterRegistry
- ✅ **Capability-driven UI** — 19 capability flags, feature visibility gating
- ✅ **Typed commands** — 8 commands with risk levels, confirmation modals
- ✅ **Environment-aware auth** — Per-backend token isolation, backward compatible
- ✅ **Socket.IO reconnection** — Auto-reconnects on environment switch
- ✅ **Canonical estate inventory** — 45 services in YAML
- ✅ **Doc generation scripts** — MkDocs + Homepage config generated from inventory

## API Usage

- All API requests are sent to the backend at the URL specified in `.env` (`VITE_API_BASE_URL`) or the current environment's backend URL.
- Uses JWT authentication per backend.
- See [API_USAGE.md](./docs/API_USAGE.md) for details on API integration and error handling.

## Documentation Map

- [API Usage Guide](./docs/API_USAGE.md)
- [UI Project Guidelines](./docs/UI_PROJECT_GUIDELINES.md)
- [Development Journey](../development-journey/README.md)

## Security Notes
- JWT tokens are stored securely in memory or cookies.
- All sensitive actions require authentication.

## Recent Updates (August 2025)
- ✅ **API Service Consolidation** - Resolved duplicate provisioningApi exports and unified all provisioning functions
- ✅ **TypeScript Error Resolution** - Fixed all compilation errors including parameter type mismatches
- ✅ **Enhanced Type Safety** - Updated interfaces and function signatures for better development experience
- ✅ **Build Stability** - Frontend now builds successfully with 0 TypeScript errors

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