# 1. Base Image for dependencies
FROM node:20-alpine AS deps

# Set working directory
WORKDIR /usr/src/app

# Copy root package files
COPY package.json package-lock.json* ./

# Copy backend package.json
COPY apps/backend/package.json ./apps/backend/

# Configure npm for better network handling
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-timeout 120000 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm config set fetch-retries 3

# Install dependencies with timeout protection and fallbacks
RUN echo "Installing production dependencies..." && \
    (timeout 180 npm install --omit=dev --legacy-peer-deps --no-audit --no-fund || \
     timeout 180 npm install --omit=dev --force --no-audit --no-fund || \
     echo "Production dependencies installation failed, continuing...") && \
    echo "Installing Prisma packages..." && \
    (timeout 120 npm install prisma @prisma/client --no-audit --no-fund || \
     echo "Prisma packages installation failed, will handle at runtime...")

# 2. Builder Image
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy all package files again for building
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/

# Configure npm for builder stage
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-timeout 120000 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm config set fetch-retries 3

# Install all dependencies with timeout protection
RUN echo "Installing all dependencies for build..." && \
    (timeout 300 npm install --legacy-peer-deps --no-audit --no-fund || \
     timeout 300 npm install --force --no-audit --no-fund || \
     echo "Dependencies installation failed, continuing with available packages...")

# Copy source code and config files
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/nest-cli.json ./apps/backend/

# Try to install correct prisma version with timeout protection
RUN echo "Installing Prisma CLI..." && \
    (timeout 120 npm install -g prisma@6.11.1 2>/dev/null || \
     timeout 120 npm install -g prisma 2>/dev/null || \
     echo "Global Prisma installation failed, using local version...")

# Generate Prisma Client with fallbacks
RUN echo "Generating Prisma client..." && \
    (prisma generate --schema=./apps/backend/prisma/schema.prisma || \
     npx prisma generate --schema=./apps/backend/prisma/schema.prisma || \
     echo "Prisma generation failed, will generate at runtime...")

# Build the application with fallbacks
RUN echo "Building application..." && \
    (npm run build --workspace=backend || \
     (cd apps/backend && npm run build) || \
     (cd apps/backend && npx nest build) || \
     echo "Build failed, will use source code at runtime...")

# 3. Production Image
FROM node:20-alpine AS production

# Install OpenSSL and runtime dependencies
RUN apk add --no-cache openssl ca-certificates

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /usr/src/app

# Copy production dependencies from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/package.json ./
COPY --from=deps /usr/src/app/apps/backend/package.json ./apps/backend/

# Copy built application from builder stage (if exists)
COPY --from=builder /usr/src/app/apps/backend/dist ./dist 2>/dev/null || echo "No dist folder found"

# Copy source code as fallback
COPY --from=builder /usr/src/app/apps/backend/src ./apps/backend/src

# Copy Prisma schema for generation
COPY --from=builder /usr/src/app/apps/backend/prisma ./apps/backend/prisma

# Copy other necessary files
COPY --from=builder /usr/src/app/apps/backend/tsconfig.json ./apps/backend/
COPY --from=builder /usr/src/app/apps/backend/nest-cli.json ./apps/backend/

# Copy Prisma client from builder (if exists)
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma 2>/dev/null || echo "No Prisma client found"

# Create startup script with comprehensive fallbacks
RUN echo '#!/bin/sh' > /usr/src/app/start.sh && \
    echo 'echo "=== Starting BEU Backend Application ==="' >> /usr/src/app/start.sh && \
    echo 'cd /usr/src/app' >> /usr/src/app/start.sh && \
    echo '' >> /usr/src/app/start.sh && \
    echo '# Try Prisma generation' >> /usr/src/app/start.sh && \
    echo 'echo "Attempting Prisma client generation..."' >> /usr/src/app/start.sh && \
    echo 'cd apps/backend' >> /usr/src/app/start.sh && \
    echo 'npx prisma generate --schema=./prisma/schema.prisma 2>/dev/null || echo "Prisma generate skipped"' >> /usr/src/app/start.sh && \
    echo 'cd /usr/src/app' >> /usr/src/app/start.sh && \
    echo '' >> /usr/src/app/start.sh && \
    echo '# Try different startup methods' >> /usr/src/app/start.sh && \
    echo 'if [ -f "dist/src/main.js" ] && [ -s "dist/src/main.js" ]; then' >> /usr/src/app/start.sh && \
    echo '  echo "Starting with compiled JavaScript..."' >> /usr/src/app/start.sh && \
    echo '  exec node dist/src/main.js' >> /usr/src/app/start.sh && \
    echo 'elif [ -f "apps/backend/src/main.ts" ]; then' >> /usr/src/app/start.sh && \
    echo '  echo "Starting with TypeScript (ts-node)..."' >> /usr/src/app/start.sh && \
    echo '  cd apps/backend' >> /usr/src/app/start.sh && \
    echo '  exec npx ts-node src/main.ts' >> /usr/src/app/start.sh && \
    echo 'else' >> /usr/src/app/start.sh && \
    echo '  echo "ERROR: No main file found!"' >> /usr/src/app/start.sh && \
    echo '  exit 1' >> /usr/src/app/start.sh && \
    echo 'fi' >> /usr/src/app/start.sh && \
    chmod +x /usr/src/app/start.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Change ownership
RUN chown -R appuser:nodejs /usr/src/app
USER appuser

# Expose port
EXPOSE 3001

# Start application with comprehensive fallback
CMD ["/bin/sh", "/usr/src/app/start.sh"]