#!/bin/bash

# AR-IO Explorer - Local Node Startup Script
# This script starts the local AR-IO node using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[AR-IO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[AR-IO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[AR-IO]${NC} $1"
}

print_error() {
    echo -e "${RED}[AR-IO]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1 && ! docker compose version > /dev/null 2>&1; then
    print_error "Docker Compose is not available. Please install Docker Compose and try again."
    exit 1
fi

print_status "Starting AR-IO node with Docker Compose..."

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    print_warning "No .env file found. Creating one from docker-env.example..."
    if [ -f docker-env.example ]; then
        cp docker-env.example .env
        print_success "Created .env file from docker-env.example"
    else
        print_warning "No docker-env.example found. Using default configuration."
    fi
fi

# Build and start the services (this may take a while on first run)
print_status "Building AR-IO node from source (this may take several minutes on first run)..."
if command -v docker-compose > /dev/null 2>&1; then
    docker-compose up -d --build
else
    docker compose up -d --build
fi

# Wait for services to be ready
print_status "Waiting for AR-IO node to be ready..."
sleep 10

# Check if AR-IO node is responding
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s -f http://localhost:4000/ar-io/info > /dev/null 2>&1; then
        print_success "AR-IO node is ready and responding!"
        break
    else
        print_status "Waiting for AR-IO node... (attempt $attempt/$max_attempts)"
        sleep 5
        attempt=$((attempt + 1))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    print_error "AR-IO node failed to start or is not responding after $max_attempts attempts."
    print_error "Check the logs with: docker-compose logs ar-io-node"
    exit 1
fi

# Display service information
print_success "AR-IO node is running!"
echo ""
echo "Service URLs:"
echo "  - AR-IO Node API: http://localhost:4000"
echo "  - GraphQL Endpoint: http://localhost:4000/graphql"
echo "  - Node Info: http://localhost:4000/ar-io/info"
echo "  - Redis: localhost:6379"
echo ""
echo "Data Sources:"
echo "  - Local datasets: ./fixtures/parquet/datasets → /data/datasets"
echo "  - Persistent data: Docker volumes (ar-io-data, ar-io-logs)"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose logs -f ar-io-node"
echo "  - Stop services: docker-compose down"
echo "  - Restart services: docker-compose restart"
echo ""
print_success "You can now start your AR-IO Explorer app and it will use the local node!"
