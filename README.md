# ASA Servers Dashboard

A React-based web dashboard for managing ARK: Survival Ascended servers, providing an intuitive interface for container management, RCON control, configuration editing, and real-time monitoring.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- ASA Management API backend running (see backend documentation)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd asa-servers-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   copy env.example .env
   # Edit .env with your API endpoint
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   ```
   http://localhost:5173
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following settings:

```bash
# API Configuration
VITE_API_URL=http://localhost:4000
VITE_API_TIMEOUT=30000

# Development
VITE_DEV_MODE=true
VITE_LOG_LEVEL=info
```

### API Backend Setup

The dashboard requires the ASA Management API backend to be running. See the backend documentation for setup instructions:

1. **Install backend as Windows service (recommended):**
   ```powershell
   cd ../asa-docker-control-api
   .\install-nssm-service.ps1
   Start-Service ASA-API
   ```

2. **Or run backend manually:**
   ```bash
   cd ../asa-docker-control-api
   npm start
   ```

3. **Verify backend is running:**
   ```bash
   curl http://localhost:4000/health
   ```

## 🏗️ Project Structure

```
asa-servers-dashboard/
├── src/
│   ├── components/          # React components
│   │   ├── ContainerList.tsx
│   │   ├── RconConsole.tsx
│   │   ├── ConfigEditor.tsx
│   │   ├── LogViewer.tsx
│   │   ├── NativeServerManager.tsx
│   │   ├── ServerProvisioner.tsx
│   │   └── Sidebar.tsx
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Configs.tsx
│   │   └── Login.tsx
│   ├── services/           # API services
│   │   ├── api.ts
│   │   └── socket.ts
│   └── utils.ts            # Utility functions
├── public/                 # Static assets
├── docker-compose.unified.yml  # Unified Docker setup
├── docker-compose.env      # Docker environment
├── start-asa-suite.ps1     # Suite startup script
└── package.json
```

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Start with unified compose
docker-compose -f docker-compose.unified.yml up -d

# Check status
docker-compose -f docker-compose.unified.yml ps

# View logs
docker-compose -f docker-compose.unified.yml logs -f
```

### Manual Docker Build

```bash
# Build image
docker build -t asa-dashboard .

# Run container
docker run -d \
  --name asa-dashboard \
  -p 3000:3000 \
  -e VITE_API_URL=http://your-api-host:4000 \
  asa-dashboard
```

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Development Server

```bash
# Start development server
npm run dev

# The dashboard will be available at:
# http://localhost:5173
```

### API Integration

The dashboard connects to the ASA Management API backend. Ensure the backend is running and accessible at the configured URL.

## 📡 Features

### Container Management
- View running Docker containers
- Start, stop, and restart containers
- Monitor container status and resources

### RCON Control
- Send RCON commands to servers
- View real-time server responses
- Command history and favorites

### Configuration Management
- Edit server configuration files
- Syntax highlighting and validation
- Backup and restore configurations

### Native Server Management
- Manage native ASA servers
- Start and stop servers
- Monitor server processes

### Real-time Monitoring
- Live log streaming
- Server status monitoring
- Performance metrics

### User Interface
- Modern, responsive design
- Dark/light theme support
- Mobile-friendly layout

## 🔐 Authentication

The dashboard uses JWT-based authentication. Login credentials are managed by the backend API.

## 🌐 CORS Configuration

The backend API is configured to allow requests from:
- `http://localhost:3000` (Production build)
- `http://localhost:5173` (Development server)
- `http://localhost:4000` (API server)
- `http://localhost:4010` (Alternative port)

## 🚀 Production Deployment

### Build for Production

```bash
# Build the application
npm run build

# The built files will be in the dist/ directory
```

### Serve Production Build

```bash
# Using a static file server
npx serve -s dist -l 3000

# Or using nginx
# Copy dist/ contents to nginx web root
```

### Environment Configuration

For production, update the environment variables:

```bash
# Production settings
VITE_API_URL=https://your-api-domain.com
VITE_DEV_MODE=false
VITE_LOG_LEVEL=warn
```

## 🔍 Troubleshooting

### Dashboard Won't Load

1. **Check if development server is running:**
   ```bash
   npm run dev
   ```

2. **Verify API backend is accessible:**
   ```bash
   curl http://localhost:4000/health
   ```

3. **Check browser console for errors**

4. **Verify environment configuration:**
   ```bash
   # Check .env file
   cat .env
   ```

### API Connection Issues

1. **Verify API URL in .env:**
   ```bash
   VITE_API_URL=http://localhost:4000
   ```

2. **Check if API is running:**
   ```bash
   # For Windows service
   Get-Service ASA-API
   
   # For manual operation
   curl http://localhost:4000/health
   ```

3. **Check CORS configuration in backend**

### Build Issues

1. **Clear node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check TypeScript errors:**
   ```bash
   npm run type-check
   ```

3. **Check linting errors:**
   ```bash
   npm run lint
   ```

## 🔗 Related Projects

- [ASA Management API](https://github.com/your-org/asa-docker-control-api) - Backend API for ASA management

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Verify the backend API is running
3. Check browser console for errors
4. Review the backend documentation