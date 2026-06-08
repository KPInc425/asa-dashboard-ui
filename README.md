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

1. **✅ Environment-aware routing** — Routes now support `/env/:envId/...` URL prefixes via `EnvAwareRouter`/`EnvAwareLayout`. The `Sidebar` and `EnvironmentSwitcher` use env-aware links when in env mode. Legacy flat routes remain fully functional.

2. **✅ Multi-environment shell** — EnvironmentContext, EnvironmentSwitcher, 3 env configs (ASA Remote, ASA Local, ILGaming Prod)

3. **✅ Backend adapter system** — ASAAdapter, NoOpAdapter, AdapterRegistry, capability manifests

4. **✅ Typed commands** — 8 commands with risk levels, ActionButton, ConfirmationModal

5. **✅ Environment-aware auth** — Per-backend token isolation, backward compatible

6. **✅ Socket.IO reconnection** — Auto-reconnects on environment switch

7. **✅ Add Server to Cluster** — Cluster details page now has "➕ Add Server" button in the servers tab. Opens a modal with form fields (name, map, ports, max players, passwords) and auto-increments ports from existing servers. Backs up to `POST /api/provisioning/clusters/:clusterName/servers` with mock fallback.

## Remaining Work — needed to complete the env switcher

These are the specific files and changes needed to make the environment switcher actually change what you see on screen. Currently the switcher works internally but pages still render ASA-only content regardless of which environment is selected.

### 1. Refactor pages to use the adapter layer

These pages still make direct API calls to hardcoded ASA endpoints. They need to use `useScopedAdapter()` and render differently based on which environment is active.

**Files to change:**
| File | Current Approach | What to change |
|------|-----------------|---------------|
| `src/pages/Dashboard.tsx` | Direct `api.get('/api/system/info')`, `api.get('/api/provisioning/debug')`, `provisioningApi.listClusters()` | Use adapter methods; render deep-link-only mode when no backend |
| `src/pages/Servers.tsx` | Partially adapted — uses `useServices()` with legacy fallback | Complete adapter integration; add capability gating |
| `src/pages/ServerDetails.tsx` | Direct `provisioningApi` + legacy hooks | Use adapter for status, logs, and commands |
| `src/pages/SystemLogs.tsx` | Direct `provisioningApi.getSystemLogs()` | Use environment-aware socket connection |
| `src/hooks/useServerData.ts` | Direct axios calls | Refactor to consume adapter instead of direct axios calls |
| `src/hooks/useServerCommand.ts` | Direct API calls | Refactor to use `adapter.executeAction()` |

**Three rendering modes per page:**

| Mode | Condition | Behavior |
|------|-----------|----------|
| **Full-control** | Backend reachable + authenticated | All features visible (current ASA behavior) |
| **Read-only** | Backend reachable, limited caps | Status only, no start/stop/restart buttons |
| **Deep-link-only** | No backend configured | Show links to Homepage/Kuma/Dozzle |

**Key hook to use:**
```tsx
import { useScopedAdapter } from '../hooks/useScopedAdapter';
import { useEnvironment } from '../contexts/EnvironmentContext';

function MyPage() {
  const { currentEnvironment } = useEnvironment();
  const { adapter, envId, backendId } = useScopedAdapter();
  
  // For deep-link-only mode
  if (currentEnvironment.backends.length === 0) {
    return <DeepLinkView links={currentEnvironment.links} />;
  }
  
  // For read-only vs full-control, check capabilities:
  // supportsCapability('canRestart') from EnvironmentContext
}
```

### 2. Gate ASA-specific features by capability

Check `supportsCapability()` from `EnvironmentContext` before showing ASA-only features:

| Feature | Capability |
|---------|-----------|
| Server start/stop/restart | `canRestart` |
| RCON console | `canRcon` |
| Config editor (Monaco) | `canEditConfig` |
| Provisioning wizard | `canProvision` |

### 3. Update tests

Write Playwright MCP tests covering:
- Environment switcher switching between all 3 envs
- Socket.IO reconnect on switch
- Deep-link mode rendering when no backend
- Auth state preserved per-backend

## Recent Updates (June 2026)

- ✅ **Multi-environment shell** — EnvironmentContext, switcher, env config
- ✅ **Backend adapter system** — ASAAdapter, NoOpAdapter, AdapterRegistry
- ✅ **Capability-driven UI** — 19 capability flags, feature visibility gating
- ✅ **Typed commands** — 8 commands with risk levels, confirmation modals
- ✅ **Environment-aware auth** — Per-backend token isolation, backward compatible
- ✅ **Socket.IO reconnection** — Auto-reconnects on environment switch
- ✅ **Canonical estate inventory** — 45 services in YAML
- ✅ **Doc generation scripts** — MkDocs + Homepage config generated from inventory
- ✅ **Add Server to Cluster** — New modal on ClusterDetails page with auto-incrementing ports

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

## Deployment (Linux / Docker)

The production stack runs via Docker on the host:

```bash
cd /home/steam/apps/asa-dashboard-ui
docker compose up -d --build
```

This builds and serves the static frontend via nginx on the configured `DASHBOARD_PORT` (default 4010).

The backend API (`asa-control-api`) is deployed separately via its own Docker compose:

```bash
cd /home/steam/apps/asa-control-api/docker
docker compose -f docker-compose.linux.yml up -d --build
```

## Local Development

```bash
npm install
cp env.example .env
# Edit .env: set VITE_API_BASE_URL to your backend API URL
npm run dev
```

---

For migration stories and debugging adventures, see the [Development Journey](../development-journey/README.md).