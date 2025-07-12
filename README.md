# ASA Servers Dashboard

A modern React-based dashboard for managing ARK: Survival Ascended servers with Docker and native Windows support.

## Features

- 🐳 **Docker Container Management** - Start, stop, restart, and monitor ASA containers
- 🖥️ **Native Windows Server Support** - Manage ASA servers running directly on Windows
- 📊 **Real-time Monitoring** - Live server status, player counts, and performance metrics
- 🔧 **Configuration Management** - Edit server configs with syntax highlighting
- 📝 **Log Streaming** - Real-time log viewing with filtering and search
- 🎮 **RCON Console** - Direct server command execution
- 🔐 **Enhanced Authentication** - User management with role-based access control
- 📦 **Mod Management** - Install and manage server mods
- 🚀 **Server Provisioning** - Automated server installation and setup

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- ASA Control API backend running

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd asa-servers-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

The dashboard will be available at `http://localhost:5173`

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
VITE_FRONTEND_ONLY=false
```

### API Connection

The dashboard connects to the ASA Control API backend. Make sure the backend is running and accessible at the configured URL.

## Authentication

The dashboard supports enhanced authentication with role-based access control:

- **Admin**: Full system access, user management, system configuration
- **Operator**: Server management, configuration editing, monitoring  
- **Viewer**: Read-only access to system information

### Default Users

- **Admin**: `admin` / `admin123` (change immediately!)
- **Operator**: `operator` / `operator123`
- **Viewer**: `viewer` / `viewer123`

## Backup & Restore System

The ASA Management Suite includes a comprehensive backup and restore system to protect your data across deployments and updates.

### 📁 Persistent Data Locations

#### **User Authentication Data**
- **Location**: `C:\ASA-API\data\`
- **Files**: 
  - `users.json` - User accounts, passwords (hashed), roles, profiles
  - `sessions.json` - Active user sessions and JWT tokens

#### **Application Logs**
- **Location**: `C:\ASA-API\logs\`
- **Files**:
  - `combined.log` - All application logs
  - `error.log` - Error-specific logs
  - `nssm-out.log` - Service stdout (created by NSSM)
  - `nssm-err.log` - Service stderr (created by NSSM)

#### **Configuration Files**
- **Location**: `C:\ASA-API\`
- **Files**:
  - `.env` - Environment variables and settings
  - `native-servers.json` - Server configurations (if using native mode)

#### **ASA Server Data** (External)
- **Location**: `G:\ARK\` (or configured base path)
- **Content**:
  - Server installations - Complete ASA server files
  - Server configs - `Game.ini`, `GameUserSettings.ini`
  - Server saves - Player data, world saves
  - SteamCMD - Steam command line tools

### 🔄 Backup Scripts

#### **Backup Script** (`backup-asa-data.ps1`)

Creates comprehensive backups of all persistent data.

**Usage:**
```powershell
# Basic backup (user data + config only)
.\backup-asa-data.ps1

# Include logs
.\backup-asa-data.ps1 -IncludeLogs

# Include ASA servers (large backup)
.\backup-asa-data.ps1 -IncludeServers

# Compress backup
.\backup-asa-data.ps1 -Compress

# Custom backup location
.\backup-asa-data.ps1 -BackupPath "D:\ASA-Backups"
```

**Features:**
- ✅ Automatic administrator privilege elevation
- ✅ User authentication data backup
- ✅ Configuration files backup
- ✅ Optional log backup
- ✅ Optional ASA server backup (large files)
- ✅ Backup compression
- ✅ Automatic cleanup of old backups (keeps last 10)
- ✅ Backup manifest creation
- ✅ Progress reporting and error handling

#### **Restore Script** (`restore-asa-data.ps1`)

Restores data from backups with safety measures.

**Usage:**
```powershell
# Restore from backup
.\restore-asa-data.ps1 -BackupPath "C:\ASA-Backups\2025-07-12_14-30-00"

# Force restore (no confirmation)
.\restore-asa-data.ps1 -BackupPath "C:\ASA-Backups\2025-07-12_14-30-00" -Force

# Include servers in restore
.\restore-asa-data.ps1 -BackupPath "C:\ASA-Backups\2025-07-12_14-30-00" -IncludeServers
```

**Safety Features:**
- ✅ Automatic safety backup before restore
- ✅ Service stop/start during restore
- ✅ File permission restoration
- ✅ Compressed backup support
- ✅ Confirmation prompts (unless forced)
- ✅ Error handling and rollback information

### 📋 Recommended Backup Schedule

| Frequency | Type | Command |
|-----------|------|---------|
| **Daily** | User data + config | `.\backup-asa-data.ps1` |
| **Weekly** | Full backup | `.\backup-asa-data.ps1 -IncludeServers -Compress` |
| **Monthly** | Archive old backups | Manual cleanup |
| **Before updates** | Manual backup | `.\backup-asa-data.ps1 -IncludeLogs` |

### 🔄 Deployment Workflow

#### **For Updates/Reinstallations:**
1. **Backup current data**: `.\backup-asa-data.ps1`
2. **Update/reinstall the service**: `.\install-nssm-service.ps1`
3. **Verify everything works**
4. **Keep backup for safety**

#### **For Disaster Recovery:**
1. **Install fresh service**: `.\install-nssm-service.ps1`
2. **Restore from backup**: `.\restore-asa-data.ps1 -BackupPath "path\to\backup"`
3. **Verify functionality**

### 🛡️ Data Protection

#### **What Gets Preserved During Updates:**
✅ User accounts and sessions (in `data/` folder)  
✅ ASA server installations (external to API)  
✅ Server configurations (in ASA server folders)  
✅ Application logs (in `logs/` folder)  

#### **What Gets Replaced During Updates:**
🔄 Application code (server.js, services, routes)  
🔄 Node.js dependencies (node_modules)  
🔄 Service configuration (NSSM settings)  

### 📊 Backup Storage

Backups are stored in `C:\ASA-Backups\` by default with timestamped directories:
```
C:\ASA-Backups\
├── 2025-07-12_14-30-00\
│   ├── data\
│   │   ├── users.json
│   │   └── sessions.json
│   ├── config\
│   │   ├── .env
│   │   └── native-servers.json
│   ├── logs\ (optional)
│   ├── servers\ (optional)
│   └── backup-manifest.json
└── 2025-07-12_15-45-00\
    └── ...
```

### 🔧 Automated Backup Setup

To set up automated daily backups, create a Windows Task Scheduler task:

1. **Open Task Scheduler**
2. **Create Basic Task**
3. **Name**: "ASA Management Suite Daily Backup"
4. **Trigger**: Daily at 2:00 AM
5. **Action**: Start a program
6. **Program**: `powershell.exe`
7. **Arguments**: `-ExecutionPolicy Bypass -File "C:\ASA-API\backup-asa-data.ps1"`

## Development

### Project Structure

```
src/
├── components/          # React components
├── pages/              # Page components
├── services/           # API and socket services
├── contexts/           # React contexts
├── utils/              # Utility functions
└── assets/             # Static assets
```

### Available Scripts

```bash
# Development
npm run dev             # Start development server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript type checking
```

### Building for Production

```bash
# Build the application
npm run build

# The built files will be in the `dist/` directory
```

## Troubleshooting

### Common Issues

#### **Build Errors**
If you encounter TypeScript build errors:
1. Run `npm run type-check` to see all type errors
2. Fix type issues in components
3. Ensure all API responses match expected types

#### **API Connection Issues**
1. Verify the backend API is running
2. Check `VITE_API_URL` in `.env`
3. Ensure CORS is properly configured on the backend

#### **Authentication Issues**
1. Check user credentials in the backend
2. Verify JWT token configuration
3. Clear browser cache and local storage

### Support

For issues and questions:
1. Check the backend API logs
2. Review the browser console for errors
3. Verify network connectivity
4. Check file permissions on the server

## License

This project is licensed under the MIT License.