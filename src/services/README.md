# Services Layer Documentation

This directory contains the modular API service layer for the ASA Dashboard frontend.

## Files

- `api.ts` - Main API service with Axios configuration and all backend endpoints
- `socket.ts` - Socket.IO service for real-time log streaming
- `index.ts` - Barrel export file for convenient importing

## Usage Examples

### Basic API Usage

```typescript
import { apiService, containerApi, authApi } from '../services';

// Using the main service object
const containers = await apiService.containers.getContainers();

// Using individual API modules
const containers = await containerApi.getContainers();
const user = await authApi.getCurrentUser();
```

### Authentication

```typescript
import { authApi } from '../services';

// Login
try {
  const authResponse = await authApi.login('username', 'password');
  console.log('Logged in as:', authResponse.user.username);
} catch (error) {
  console.error('Login failed:', error.message);
}

// Check authentication status
if (authApi.isAuthenticated()) {
  // User is logged in
}

// Logout
authApi.logout();
```

### Container Management

```typescript
import { containerApi } from '../services';

// Get all containers
const containers = await containerApi.getContainers();

// Start a container
await containerApi.startContainer('asa-server-1');

// Send RCON command
const response = await containerApi.sendRconCommand('asa-server-1', 'listplayers');
console.log(response.response);
```

### Configuration Management

```typescript
import { configApi } from '../services';

// Load config file
const config = await configApi.loadConfig('TheIsland');

// Save config file
await configApi.saveConfig('TheIsland', '# Server configuration\nMaxPlayers=70');
```

### Real-time Log Streaming

```typescript
import { socketService } from '../services';

// Connect to container logs
await socketService.connect('asa-server-1');

// Subscribe to log events
socketService.onLog((logMessage) => {
  console.log(`[${logMessage.timestamp}] ${logMessage.message}`);
});

// Subscribe to connection events
socketService.onConnect(() => {
  console.log('Connected to log stream');
});

socketService.onDisconnect((reason) => {
  console.log('Disconnected from log stream:', reason);
});

// Disconnect when done
socketService.disconnect();
```

### Error Handling

```typescript
import { apiService, ApiError } from '../services';

try {
  const containers = await apiService.containers.getContainers();
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.status}:`, error.message);
    
    if (error.status === 401) {
      // Handle unauthorized
      authApi.logout();
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Environment Variables

Make sure to set the following environment variable in your `.env` file:

```env
VITE_API_URL=http://localhost:3000
```

## TypeScript Types

All API responses are properly typed. Import the types you need:

```typescript
import type { Container, RconResponse, ConfigFile, User } from '../services';
```

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch blocks
2. **Authentication**: Check authentication status before making protected API calls
3. **Socket Management**: Always disconnect from sockets when components unmount
4. **URL Encoding**: Container names are automatically URL-encoded in the service layer
5. **Reconnection**: Socket.IO automatically handles reconnection with exponential backoff
6. **Token Management**: JWT tokens are automatically managed in localStorage

## API Endpoints Covered

- ✅ `GET /api/containers` - List containers
- ✅ `POST /api/containers/:name/start` - Start container
- ✅ `POST /api/containers/:name/stop` - Stop container
- ✅ `POST /api/containers/:name/restart` - Restart container
- ✅ `POST /api/containers/:name/rcon` - Send RCON command
- ✅ `GET /api/configs/:map` - Load config file
- ✅ `PUT /api/configs/:map` - Save config file
- ✅ `GET /api/lock-status` - Get update lock status
- ✅ `GET /api/logs/:container` - WebSocket log stream
- ✅ `POST /api/auth/login` - Login
- ✅ `GET /api/auth/me` - Get current user info 