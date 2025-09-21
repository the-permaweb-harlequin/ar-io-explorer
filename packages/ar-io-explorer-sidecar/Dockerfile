FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite

# Set working directory
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package*.json ./

# Copy shared types package
COPY packages/shared-types/ ./packages/shared-types/

# Copy sidecar package
COPY packages/ar-io-explorer-sidecar/package*.json ./packages/ar-io-explorer-sidecar/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Build shared types
RUN cd packages/shared-types && pnpm build

# Copy sidecar source code
COPY packages/ar-io-explorer-sidecar/src/ ./packages/ar-io-explorer-sidecar/src/
COPY packages/ar-io-explorer-sidecar/tsconfig.json ./packages/ar-io-explorer-sidecar/

# Build sidecar
RUN cd packages/ar-io-explorer-sidecar && pnpm build

# Create data and config directories
RUN mkdir -p ./data ./config

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S harlequin -u 1001

# Change ownership of app directory
RUN chown -R harlequin:nodejs /app

# Switch to non-root user
USER harlequin

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:3001/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the application
CMD ["node", "packages/ar-io-explorer-sidecar/dist/server.js"]
