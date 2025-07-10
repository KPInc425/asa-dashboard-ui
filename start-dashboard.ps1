# ASA Dashboard - PowerShell Frontend Management Script
# This script makes it easy to manage the ASA Dashboard frontend

param(
    [string]$Mode = "help"
)

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Backend API Configuration
$DefaultBackendUrl = "http://localhost:4000"

Write-Host ""
Write-Host "========================================"
Write-Host "Please enter the backend API URL:"
Write-Host "  Default: $DefaultBackendUrl"
Write-Host "  Or enter a custom URL (e.g. http://192.168.1.100:4000)"
$BackendUrl = Read-Host "Backend URL (press Enter for default)"
if ([string]::IsNullOrEmpty($BackendUrl)) {
    $BackendUrl = $DefaultBackendUrl
    Write-Host "Using default URL: $BackendUrl"
}

# Function to check if Node.js is installed
function Test-Node {
    try {
        node --version | Out-Null
        Write-Success "Node.js is available"
        return $true
    } catch {
        Write-Error "Node.js is not installed. Please install Node.js 18+ and try again."
        return $false
    }
}

# Function to check if npm is installed
function Test-Npm {
    try {
        npm --version | Out-Null
        Write-Success "npm is available"
        return $true
    } catch {
        Write-Error "npm is not installed. Please install npm and try again."
        return $false
    }
}

# Function to check if Docker is running
function Test-Docker {
    try {
        docker info | Out-Null
        Write-Success "Docker is running"
        return $true
    } catch {
        Write-Error "Docker is not running. Please start Docker Desktop and try again."
        return $false
    }
}

# Function to show usage
function Show-Usage {
    Write-Host ""
    Write-Host "========================================"
    Write-Host "ASA Dashboard - Frontend Management"
    Write-Host "========================================"
    Write-Host ""
    Write-Host "Usage: .\start-dashboard.ps1 [MODE]"
    Write-Host ""
    Write-Host "Modes:"
    Write-Host "  dev          - Start development server (hot reload)"
    Write-Host "  build        - Build for production"
    Write-Host "  serve        - Serve built files locally"
    Write-Host "  docker-dev   - Run in Docker (development)"
    Write-Host "  docker-prod  - Run in Docker (production)"
    Write-Host "  test         - Run tests and linting"
    Write-Host "  clean        - Clean build artifacts"
    Write-Host "  help         - Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\start-dashboard.ps1 dev         # Start development server"
    Write-Host "  .\start-dashboard.ps1 build       # Build for production"
    Write-Host "  .\start-dashboard.ps1 serve       # Serve built files"
    Write-Host "  .\start-dashboard.ps1 docker-dev  # Run in Docker (dev)"
    Write-Host ""
    Write-Host "Current Backend URL: $BackendUrl"
    Write-Host ""
    Write-Host "Access URLs:"
    Write-Host "  Development: http://localhost:5173"
    Write-Host "  Production:  http://localhost:4173 (after build)"
    Write-Host "  Docker Dev:  http://localhost:5173"
    Write-Host ""
}

# Function to start development mode
function Start-Development {
    Write-Status "Starting ASA Dashboard in DEVELOPMENT mode..."
    
    if (-not (Test-Node)) { return }
    if (-not (Test-Npm)) { return }
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Status "Installing dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install dependencies"
            return
        }
    }
    
    # Set environment variables
    $env:VITE_API_URL = $BackendUrl
    $env:VITE_SOCKET_URL = $BackendUrl
    
    Write-Status "Starting development server..."
    Write-Status "Backend API URL: $BackendUrl"
    npm run dev
}

# Function to build for production
function Build-Production {
    Write-Status "Building ASA Dashboard for PRODUCTION..."
    
    if (-not (Test-Node)) { return }
    if (-not (Test-Npm)) { return }
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Status "Installing dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install dependencies"
            return
        }
    }
    
    # Set environment variables
    $env:VITE_API_URL = $BackendUrl
    $env:VITE_SOCKET_URL = $BackendUrl
    
    Write-Status "Building for production..."
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Build completed successfully!"
        Write-Host ""
        Write-Host "📁 Build output: dist/"
        Write-Host "🌐 To serve: .\start-dashboard.ps1 serve"
        Write-Host "📦 To deploy: Copy dist/ folder to your web server"
    } else {
        Write-Error "Build failed"
    }
}

# Function to serve built files
function Serve-Built {
    Write-Status "Serving built ASA Dashboard files..."
    
    if (-not (Test-Node)) { return }
    if (-not (Test-Npm)) { return }
    
    if (-not (Test-Path "dist")) {
        Write-Error "No build found. Run '.\start-dashboard.ps1 build' first."
        return
    }
    
    Write-Status "Starting preview server..."
    npm run preview
}

# Function to run in Docker (development)
function Start-DockerDev {
    Write-Status "Starting ASA Dashboard in Docker (DEVELOPMENT mode)..."
    
    if (-not (Test-Docker)) { return }
    
    # Set environment variables for docker compose
    $env:COMPOSE_BACKEND_URL = $BackendUrl
    
    Write-Status "Building and starting Docker container..."
    docker compose -f docker-compose.dev.yml up --build -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Docker development mode started!"
        Write-Host ""
        Write-Host "🌐 Access URL: http://localhost:5173"
        Write-Host "🔧 Commands:"
        Write-Host "   View logs: docker compose logs -f"
        Write-Host "   Stop:      docker compose down"
    } else {
        Write-Error "Failed to start Docker container"
    }
}

# Function to run in Docker (production)
function Start-DockerProd {
    Write-Status "Starting ASA Dashboard in Docker (PRODUCTION mode)..."
    
    if (-not (Test-Docker)) { return }
    
    # Build first
    Build-Production
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed, cannot start production container"
        return
    }
    
    # Set environment variables for docker compose
    $env:COMPOSE_BACKEND_URL = $BackendUrl
    
    Write-Status "Building and starting production Docker container..."
    docker compose -f docker-compose.yml up --build -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Docker production mode started!"
        Write-Host ""
        Write-Host "🌐 Access URL: http://localhost:4173"
        Write-Host "🔧 Commands:"
        Write-Host "   View logs: docker compose logs -f"
        Write-Host "   Stop:      docker compose down"
    } else {
        Write-Error "Failed to start production Docker container"
    }
}

# Function to run tests
function Run-Tests {
    Write-Status "Running ASA Dashboard tests..."
    
    if (-not (Test-Node)) { return }
    if (-not (Test-Npm)) { return }
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Status "Installing dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install dependencies"
            return
        }
    }
    
    Write-Status "Running tests..."
    npm test
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "All tests passed!"
    } else {
        Write-Error "Tests failed"
    }
}

# Function to clean build artifacts
function Clean-Build {
    Write-Status "Cleaning build artifacts..."
    
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-Success "Removed dist/ folder"
    }
    
    if (Test-Path "node_modules") {
        Write-Warning "Remove node_modules? (y/N)"
        $response = Read-Host
        if ($response -eq "y" -or $response -eq "Y") {
            Remove-Item -Recurse -Force "node_modules"
            Write-Success "Removed node_modules/ folder"
        } else {
            Write-Status "Keeping node_modules/ folder"
        }
    }
    
    Write-Success "Cleanup completed"
}

# Main script logic
Write-Host ""
Write-Host "========================================"
Write-Host "Configuration Summary:"
Write-Host "  Backend API URL: $BackendUrl"
Write-Host ""
Write-Host "Note: This is a startup script. For subsequent runs, you can:"
Write-Host "  - Use 'npm run dev' for development"
Write-Host "  - Use 'npm run build' for production build"
Write-Host "  - Use 'npm run preview' to serve built files"
Write-Host "  - Or run this script again to reconfigure"
Write-Host "========================================"
Write-Host ""

switch ($Mode.ToLower()) {
    "dev" { Start-Development }
    "build" { Build-Production }
    "serve" { Serve-Built }
    "docker-dev" { Start-DockerDev }
    "docker-prod" { Start-DockerProd }
    "test" { Run-Tests }
    "clean" { Clean-Build }
    "help" { Show-Usage }
    default { Show-Usage }
} 