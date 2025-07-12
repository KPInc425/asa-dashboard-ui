# ASA Management Suite Dashboard

A React-based web interface for managing ARK: Survival Ascended (ASA) Docker clusters and native servers.

## Features

- **Container Management**: Start, stop, and monitor ASA Docker containers
- **RCON Console**: Send commands directly to servers
- **Config Editor**: Edit server configuration files with Monaco Editor
- **Real-time Logs**: Stream server logs with WebSocket connections
- **User Management**: Role-based access control with user management
- **First-Time Setup**: Secure initial configuration for default admin user

## First-Time Setup

When you first log in with the default admin credentials (`admin` / `admin123`), the system will automatically detect this and require you to complete a first-time setup process. This includes:

- **Password Change**: Mandatory strong password update
- **Username Change**: Optional username change for better security
- **Profile Information**: Personal details and preferences
- **Email Setup**: Contact information for notifications

### Security Benefits

- Prevents continued use of default credentials
- Ensures strong password policies are enforced
- Allows customization of admin account details
- Maintains audit trail of initial setup

### Setup Process

1. Log in with default credentials (`admin` / `admin123`)
2. Complete the mandatory setup form
3. Choose a strong password (validated in real-time)
4. Optionally change your username
5. Add personal information and preferences
6. Submit to complete setup

After setup completion, you'll have full access to the ASA Management Suite with your new secure credentials.

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:4000
VITE_FRONTEND_ONLY=false
```

### Building for Production

```bash
npm run build
```

## API Integration

The dashboard communicates with the ASA Control API backend for all server management operations. Ensure the backend is running and accessible at the configured API URL.

## Authentication

The dashboard uses JWT-based authentication with the following features:

- Secure token storage
- Automatic token refresh
- Role-based access control
- Session management
- First-time setup enforcement

## User Roles

- **Admin**: Full access to all features including user management
- **Operator**: Can manage servers and configurations
- **Viewer**: Read-only access to server status and logs