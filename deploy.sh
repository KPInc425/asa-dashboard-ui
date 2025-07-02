#!/bin/bash

# ARK Dashboard Deployment Script
set -e

echo "🦖 ARK Dashboard Deployment Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install it and try again."
    exit 1
fi

# Build the image
print_status "Building ARK Dashboard Docker image..."
docker-compose build --no-cache

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down

# Start the services
print_status "Starting ARK Dashboard..."
docker-compose up -d

# Wait for container to be healthy
print_status "Waiting for container to be healthy..."
timeout=60
counter=0
while [ $counter -lt $timeout ]; do
    if docker-compose ps | grep -q "healthy"; then
        print_status "Container is healthy!"
        break
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done

if [ $counter -eq $timeout ]; then
    print_warning "Container health check timeout. Checking logs..."
    docker-compose logs ark-dashboard
else
    print_status "ARK Dashboard is running successfully!"
    echo ""
    echo "🌐 Access your dashboard at:"
    echo "   http://localhost:3001"
    echo ""
    echo "🔧 Management commands:"
    echo "   View logs:     docker-compose logs -f ark-dashboard"
    echo "   Stop:          docker-compose down"
    echo "   Restart:       docker-compose restart ark-dashboard"
    echo "   Update:        ./deploy.sh"
    echo ""
    echo "📋 Container status:"
    docker-compose ps
fi 