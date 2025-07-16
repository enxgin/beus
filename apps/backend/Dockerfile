# Optimized Dockerfile for Coolify deployment with network resilience
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache python3 make g++ openssl ca-certificates

WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Configure npm with optimized settings for Coolify
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-timeout 30000 && \
    npm config set fetch-retry-mintimeout 5000 && \
    npm config set fetch-retry-maxtimeout 30000 && \
    npm config set fetch-retries 2

# Install dependencies with retries
RUN echo "=== Installing dependencies with retries ===" && \
    for i in 1 2 3; do \
      npm install --legacy-peer-deps --no-audit --no-fund && break; \
      echo "npm install failed, retrying..."; \
      sleep 5; \
    done || (echo "npm install failed after 3 retries"; exit 1)

# Copy source code after dependency installation
COPY . .

# Generate Prisma Client and Build Application using local binaries
RUN echo "=== Starting Build-Time Optimizations ===" && \
    cd apps/backend && \
    echo "--- Running Prisma Generate ---" && \
    ../../node_modules/.bin/prisma generate --schema=./prisma/schema.prisma || (echo "Prisma Generate FAILED"; exit 1) && \
    echo "--- Prisma Generate Successful ---" && \
    echo "--- Running NestJS Build ---" && \
    ../../node_modules/.bin/nest build || (echo "NestJS Build FAILED"; exit 1) && \
    echo "--- NestJS Build Successful ---" && \
    cd /usr/src/app && \
    echo "=== Build-Time Optimizations Completed Successfully ==="

# Production stage
FROM node:20-alpine AS production

# Install runtime dependencies including curl for healthcheck
RUN apk add --no-cache openssl ca-certificates curl

# Skip global packages - use npx for better performance

WORKDIR /usr/src/app

# Copy everything from base
COPY --from=base /usr/src/app .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Create optimized startup script (minimal runtime operations)
RUN echo '#!/bin/sh' > /usr/src/app/start.sh && \
    echo 'echo "=== BEU Backend Starting ==="' >> /usr/src/app/start.sh && \
    echo 'cd /usr/src/app' >> /usr/src/app/start.sh && \
    echo '' >> /usr/src/app/start.sh && \
    echo '# Quick dependency check (fallback only)' >> /usr/src/app/start.sh && \
    echo 'if [ ! -d "node_modules/@nestjs" ]; then' >> /usr/src/app/start.sh && \
    echo '  echo "Critical dependencies missing, installing..."' >> /usr/src/app/start.sh && \
    echo '  timeout 30 npm install --legacy-peer-deps --no-audit --no-fund 2>/dev/null || echo "Fallback install failed"' >> /usr/src/app/start.sh && \
    echo 'fi' >> /usr/src/app/start.sh && \
    echo '' >> /usr/src/app/start.sh && \
    echo '# Start application with optimized fallbacks' >> /usr/src/app/start.sh && \
    echo 'echo "Starting application..."' >> /usr/src/app/start.sh && \
    echo 'if [ -f "apps/backend/dist/src/main.js" ]; then' >> /usr/src/app/start.sh && \
    echo '  echo "Starting with pre-built JavaScript..."' >> /usr/src/app/start.sh && \
    echo '  exec node apps/backend/dist/src/main.js' >> /usr/src/app/start.sh && \
    echo 'elif [ -f "apps/backend/src/main.ts" ]; then' >> /usr/src/app/start.sh && \
    echo '  echo "Fallback: Starting with TypeScript..."' >> /usr/src/app/start.sh && \
    echo '  cd apps/backend' >> /usr/src/app/start.sh && \
    echo '  # Quick Prisma generation if needed' >> /usr/src/app/start.sh && \
    echo '  [ ! -d "node_modules/.prisma" ] && npx prisma generate --schema=./prisma/schema.prisma 2>/dev/null' >> /usr/src/app/start.sh && \
    echo '  exec npx ts-node src/main.ts' >> /usr/src/app/start.sh && \
    echo 'else' >> /usr/src/app/start.sh && \
    echo '  echo "ERROR: No main file found!"' >> /usr/src/app/start.sh && \
    echo '  ls -la apps/backend/src/' >> /usr/src/app/start.sh && \
    echo '  exit 1' >> /usr/src/app/start.sh && \
    echo 'fi' >> /usr/src/app/start.sh && \
    chmod +x /usr/src/app/start.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs && \
    chown -R appuser:nodejs /usr/src/app

USER appuser

# Add optimized healthcheck for Coolify (faster startup)
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=2 \
    CMD curl -f http://localhost:3001/health || exit 1

# Expose port
EXPOSE 3001

# Start with our robust script
CMD ["/bin/sh", "/usr/src/app/start.sh"]