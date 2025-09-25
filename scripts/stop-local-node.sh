#!/bin/bash

# AR-IO Explorer - Local Node Stop Script
# This script stops the local AR-IO node Docker containers

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

print_status "Stopping AR-IO node containers..."

# Stop the services
if command -v docker-compose > /dev/null 2>&1; then
    docker-compose down
else
    docker compose down
fi

print_success "AR-IO node containers stopped successfully!"

# Optionally remove volumes (uncomment if you want to clean up data)
# print_warning "To remove all data volumes, run:"
# echo "docker-compose down -v"
