# ASA Dashboard API Services

This directory contains the modular API services for the ASA Dashboard frontend. The services have been refactored into smaller, focused modules for better maintainability and organization.

## 📁 File Structure

```
services/
├── api-core.ts          # Core types, API setup, and shared utilities
├── api-containers.ts    # Container and server management
├── api-config.ts        # Configuration management
├── api-auth.ts          # Authentication and user management
├── api-logs.ts          # Logs and file management
├── api-environment.ts   # Environment and system management
├── api-provisioning.ts  # Server provisioning and cluster management
├── api-lock.ts          # Lock status and system status
├── api.ts               # Main entry point (exports all modules)
├── socket.ts            # Socket.IO services
├── discord.ts           # Discord integration services
├── index.ts             # Services index (exports everything)
└── README.md            # This file
```

## 🔧 API Modules

### `api-core.ts`
- **Purpose**: Core types, API setup, and shared utilities
- **Exports**: 
  - All TypeScript interfaces and types
  - `ApiError` class for error handling
  - `FRONTEND_ONLY_MODE` flag
  - `api` Axios instance with interceptors
  - `healthCheck` function

### `api-containers.ts`
- **Purpose**: Container and server management
- **Exports**: `containerApi` object
- **Features**:
  - Docker container operations (start, stop, restart)
  - Native server management
  - RCON command execution
  - Server configuration files
  - Save file management
  - Auto-shutdown configuration

### `api-config.ts`
- **Purpose**: Configuration management
- **Exports**: `configApi` object and ARK config functions
- **Features**:
  - Server configuration listing and management
  - Config file operations
  - ARK-specific configuration handling

### `api-auth.ts`
- **Purpose**: Authentication and user management
- **Exports**: `authApi` object
- **Features**:
  - User login/logout
  - Authentication status checking
  - User information retrieval
  - Frontend-only mode support

### `api-logs.ts`
- **Purpose**: Logs and file management
- **Exports**: `logsApi` object
- **Features**:
  - Log file listing and retrieval
  - Save file operations (upload, download, backup)
  - WebSocket URL generation for real-time logs

### `api-environment.ts`
- **Purpose**: Environment and system management
- **Exports**: `environmentApi` object
- **Features**:
  - Environment file management
  - Docker Compose configuration
  - ARK server configurations
  - Mod management

### `api-provisioning.ts`
- **Purpose**: Server provisioning and cluster management
- **Exports**: `provisioningApi` object and individual functions
- **Features**:
  - System initialization and setup
  - SteamCMD management
  - Cluster creation and management
  - Server provisioning
  - Backup and restore operations
  - Update management

### `api-lock.ts`
- **Purpose**: Lock status and system status
- **Exports**: `lockApi` object
- **Features**:
  - Update lock status checking
  - System status monitoring

## 🚀 Usage

### Importing the API Service

```typescript
// Import the main API service object
import { apiService } from '@/services';

// Use specific API modules
const containers = await apiService.containers.getContainers();
const user = await apiService.auth.getCurrentUser();
const logs = await apiService.logs.getLogFiles('server-name');
```

### Direct Module Imports

```typescript
// Import specific modules directly
import { containerApi, authApi, logsApi } from '@/services';

// Use individual APIs
const containers = await containerApi.getContainers();
const user = await authApi.getCurrentUser();
const logs = await logsApi.getLogFiles('server-name');
```

### Individual Function Imports

```typescript
// Import specific functions
import { 
  createCluster, 
  backupServer, 
  getSystemInfo 
} from '@/services';

// Use individual functions
const cluster = await createCluster(clusterConfig);
const backup = await backupServer('server-name');
const systemInfo = await getSystemInfo();
```

## 🔄 Frontend-Only Mode

The API services support a frontend-only mode for testing and development:

```typescript
// Set in .env file
VITE_FRONTEND_ONLY=true

// Test credentials
username: 'admin'
password: 'admin123'
```

When frontend-only mode is enabled:
- All API calls return mock data
- No actual backend communication occurs
- Simulated delays provide realistic testing experience
- Mock data includes realistic server states and responses

## 🛠️ Error Handling

All API functions use the `ApiError` class for consistent error handling:

```typescript
import { ApiError } from '@/services';

try {
  const result = await apiService.containers.startContainer('server-name');
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.status}: ${error.message}`);
  }
}
```

## 📝 TypeScript Support

All API functions are fully typed with TypeScript interfaces:

```typescript
import type { Container, User, RconResponse } from '@/services';

const containers: Container[] = await apiService.containers.getContainers();
const user: User = await apiService.auth.getCurrentUser();
const rconResponse: RconResponse = await apiService.containers.sendRconCommand('server', 'listplayers');
```

## 🔧 Configuration

The API services are configured through environment variables:

```env
# API Configuration
VITE_API_URL=http://localhost:4000
VITE_FRONTEND_ONLY=false

# Custom endpoint (optional, stored in localStorage)
# Can be set via localStorage.setItem('api_endpoint', 'http://custom-api-url')
```

## 📚 Migration from Old API

The refactored API maintains full backward compatibility. Existing code should continue to work without changes:

```typescript
// Old way (still works)
import { containerApi } from '@/services/api';

// New way (recommended)
import { containerApi } from '@/services';
// or
import { apiService } from '@/services';
const containers = await apiService.containers.getContainers();
```

## 🎯 Benefits of Modular Structure

1. **Maintainability**: Each module has a single responsibility
2. **Testability**: Individual modules can be tested in isolation
3. **Code Organization**: Related functionality is grouped together
4. **Tree Shaking**: Unused modules can be excluded from builds
5. **Developer Experience**: Easier to find and modify specific functionality
6. **Type Safety**: Better TypeScript support with focused interfaces 