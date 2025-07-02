# ARK: Survival Ascended Dashboard

> 🔗 This is the frontend dashboard for the [ASA Control API](https://github.com/kpinc425/asa-control-api)

A modern, feature-rich web dashboard for managing ARK: Survival Ascended Docker servers with real-time monitoring, RCON console, configuration editing, and log streaming.

![ARK Dashboard](https://img.shields.io/badge/ARK-Survival%20Ascended-orange)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.11-38B2AC)
![DaisyUI](https://img.shields.io/badge/DaisyUI-5.0.43-5A0EF8)

## 🦖 Features

### 🎮 Server Management
- **Real-time Server Status** - Monitor all your ARK servers at a glance
- **One-Click Controls** - Start, stop, and restart servers instantly
- **Bulk Operations** - Manage multiple servers simultaneously
- **Server Statistics** - View running/stopped server counts and status

### 💬 RCON Console
- **Interactive Console** - Send commands directly to your servers
- **Command History** - Browse and reuse previous commands
- **Auto-completion** - Built-in ARK command suggestions
- **Real-time Responses** - See command results instantly

### ⚙️ Configuration Editor
- **Syntax Highlighting** - Monaco Editor with INI file support
- **Live Editing** - Edit server configurations in real-time
- **Auto-save** - Changes are saved automatically
- **Map Support** - Support for all ARK maps with custom icons

### 📋 Log Streaming
- **Real-time Logs** - Live log streaming via WebSocket
- **Log Filtering** - Filter by log level and search terms
- **Auto-scroll** - Automatic scrolling to latest logs
- **Export Functionality** - Download logs for analysis

### 🔐 Authentication
- **JWT-based Auth** - Secure login system
- **Protected Routes** - Route protection for authenticated users
- **Session Management** - Automatic token handling

### 🎨 Modern UI/UX
- **ARK-themed Design** - Custom color scheme inspired by ARK: Survival Ascended
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Smooth Animations** - Custom CSS animations and transitions
- **Dark Mode** - Optimized for dark environments
- **Glass Morphism** - Modern glass-like UI elements

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API server running (optional - see Frontend-Only Mode below)
- Docker (for containerized deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd asa-servers-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   # Create .env file
   echo "VITE_FRONTEND_ONLY=true" > .env
   ```
   
   For frontend-only testing, your `.env` should contain:
   ```env
   VITE_FRONTEND_ONLY=true
   ```
   
   For backend mode, add your API URL:
   ```env
   VITE_FRONTEND_ONLY=false
   VITE_API_URL=http://your-ark-server:4000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### 🔧 Frontend-Only Mode (Testing Without Backend)

The dashboard includes a frontend-only mode for testing without a backend server:

1. **Enable Frontend-Only Mode**
   Add `VITE_FRONTEND_ONLY=true` to your `.env` file

2. **Test Credentials**
   - Username: `admin`
   - Password: `admin123`

3. **Features Available**
   - ✅ Mock server data (4 sample ARK servers)
   - ✅ Simulated API responses
   - ✅ RCON command responses
   - ✅ Configuration editing
   - ✅ All UI interactions

4. **Switch to Backend Mode**
   When your backend is ready, set `VITE_FRONTEND_ONLY=false` or remove the variable from `.env`

## 🏗️ Architecture

### Frontend Stack
- **React 19** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS v4** - Utility-first CSS framework
- **DaisyUI v5** - Component library built on Tailwind
- **Monaco Editor** - Code editor for configuration files
- **Socket.IO Client** - Real-time WebSocket communication
- **Axios** - HTTP client for API communication

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ContainerList.tsx
│   ├── RconConsole.tsx
│   ├── ConfigEditor.tsx
│   ├── LogViewer.tsx
│   ├── Sidebar.tsx
│   └── LoadingSpinner.tsx
├── pages/              # Page-level components
│   ├── Dashboard.tsx
│   └── Login.tsx
├── services/           # API and socket services
│   ├── api.ts
│   ├── socket.ts
│   └── index.ts
├── App.tsx            # Main app component
└── main.tsx          # Entry point
```

## 🔌 API Integration

### External Backend Configuration

When your backend is hosted on a different server (e.g., your ARK server machine), configure the dashboard to connect to it:

1. **Set Backend URL**
   ```env
   VITE_API_URL=http://your-ark-server-ip:4000
   # or
   BACKEND_API_URL=http://your-ark-server-ip:4000
   ```

2. **CORS Configuration**
   Your backend must allow CORS requests from the dashboard domain:
   ```javascript
   // Backend CORS configuration
   app.use(cors({
     origin: ['http://your-dashboard-domain:4010', 'http://localhost:4010'],
     credentials: true
   }));
   ```

3. **Network Access**
   Ensure the backend port (4000) is accessible from the dashboard server.

### API Endpoints

The dashboard communicates with your backend API through the following endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/containers` | List all containers |
| POST | `/api/containers/:name/start` | Start container |
| POST | `/api/containers/:name/stop` | Stop container |
| POST | `/api/containers/:name/restart` | Restart container |
| POST | `/api/containers/:name/rcon` | Send RCON command |
| GET | `/api/configs/:map` | Load config file |
| PUT | `/api/configs/:map` | Save config file |
| GET | `/api/lock-status` | Get update lock status |
| GET | `/api/logs/:container` | WebSocket log stream |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |

## 🎨 Customization

### Theme Colors
The dashboard uses a custom ARK-themed color palette defined in `src/index.css`:

- **Primary**: Warm orange (#FF6B35)
- **Secondary**: Deep red (#DA0000) 
- **Accent**: Gold (#FFD700)
- **Background**: Dark blue-gray
- **Text**: Light gray

### Animations
Custom CSS animations are available:
- `.ark-glow` - Pulsing glow effect
- `.ark-pulse` - Scale pulse animation
- `.ark-slide-in` - Slide-in entrance animation
- `.ark-fade-in` - Fade-in animation
- `.ark-rotate` - Continuous rotation
- `.ark-bounce` - Bounce animation

## 🐳 Docker Deployment

### Quick Start with Docker

1. **Build and run with Docker Compose:**
   ```bash
   # Build and start the container
   docker-compose up -d
   
   # Or use the deployment script
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Access the dashboard:**
   - Frontend-only mode: `http://localhost:4010`
   - Login with: `admin` / `admin123`

### Docker Configuration

#### **Environment Variables**
```env
# In docker-compose.yml or .env file
DASHBOARD_PORT=4010                    # Dashboard port (configurable)
BACKEND_API_URL=http://your-ark-server:4000  # Backend URL
VITE_FRONTEND_ONLY=false               # Frontend-only mode
```

#### **Port Configuration**
```yaml
# In docker-compose.yml
ports:
  - "${DASHBOARD_PORT:-4010}:80"  # Configurable port, defaults to 4010
```

#### **Nginx Proxy Setup**
The container includes nginx with:
- ✅ **SPA Routing** - React Router support
- ✅ **Gzip Compression** - Optimized assets
- ✅ **Security Headers** - XSS protection, etc.
- ✅ **Health Checks** - Container monitoring
- ✅ **API Proxying** - Ready for backend integration

### Production Deployment

#### **With Traefik (Recommended)**
```yaml
# docker-compose.yml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.ark-dashboard.rule=Host(`ark-dashboard.yourdomain.com`)"
  - "traefik.http.routers.ark-dashboard.tls=true"
  - "traefik.http.routers.ark-dashboard.tls.certresolver=letsencrypt"
```

#### **With Custom Nginx Proxy**
1. Copy `nginx.production.conf` to your nginx server
2. Update the `proxy_pass` URLs to point to your backend
3. Configure SSL certificates

### Management Commands
```bash
# View logs
docker-compose logs -f ark-dashboard

# Restart container
docker-compose restart ark-dashboard

# Stop all services
docker-compose down

# Update and redeploy
./deploy.sh

# Check container status
docker-compose ps
```

## 🧪 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Development Notes
- Uses Vite for fast hot module replacement
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS v4 with DaisyUI v5 for styling
- Monaco Editor for configuration editing
- Socket.IO for real-time features

## 🔧 Configuration

### Environment Variables
```env
# Dashboard Configuration
DASHBOARD_PORT=4010

# Backend Configuration (when not using frontend-only mode)
BACKEND_API_URL=http://your-ark-server:4000
VITE_API_URL=http://your-ark-server:4000

# Frontend-only mode (set to true for testing without backend)
VITE_FRONTEND_ONLY=false

# Optional: Override default timeout
VITE_API_TIMEOUT=30000

# Optional: Enable debug logging
VITE_DEBUG=true
```

### Backend Requirements
Your backend should implement:
- RESTful API endpoints for container management
- WebSocket support for real-time log streaming
- JWT authentication
- CORS configuration for frontend access

## 📱 Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **ARK: Survival Ascended** - For the amazing game that inspired this dashboard
- **React Team** - For the incredible framework
- **Tailwind CSS** - For the utility-first CSS framework
- **DaisyUI** - For the beautiful component library
- **Monaco Editor** - For the powerful code editor

---

**Survive, Build, Tame, and Manage with ARK Dashboard! 🦖**
