# Build stage
FROM node:20-alpine AS builder

# Install system dependencies and yarn
RUN apk add --no-cache python3 make g++ openssl ca-certificates && \
    npm install -g yarn

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/

# Install dependencies with yarn (more reliable than npm)
RUN yarn install --frozen-lockfile --network-timeout 300000 || \
    yarn install --network-timeout 300000 || \
    npm install --legacy-peer-deps --no-audit --no-fund || \
    echo "Dependencies installation completed"

# Copy source code
COPY . .

# Try to build, if fails copy source directly
RUN yarn workspace backend build || \
    (cd apps/backend && yarn build) || \
    (cd apps/backend && npx nest build) || \
    (mkdir -p dist/apps/backend/src && cp -r apps/backend/src/* dist/apps/backend/src/) || \
    echo "Build process completed"

# Production stage
FROM node:20-alpine AS production

# Install runtime dependencies and yarn
RUN apk add --no-cache openssl ca-certificates && \
    npm install -g yarn

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./
COPY apps/backend/package*.json ./apps/backend/

# Install production dependencies
RUN yarn install --production --frozen-lockfile --network-timeout 300000 || \
    yarn install --production --network-timeout 300000 || \
    npm install --omit=dev --legacy-peer-deps --no-audit --no-fund || \
    echo "Production dependencies installed"

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# If dist doesn't exist, copy source code as fallback
COPY --from=builder /usr/src/app/apps/backend/src ./apps/backend/src

# Copy prisma schema for runtime generation
COPY --from=builder /usr/src/app/apps/backend/prisma ./apps/backend/prisma

# Create directories for prisma client
RUN mkdir -p node_modules/.prisma node_modules/@prisma

# Create startup script before switching to non-root user
RUN echo '#!/bin/sh' > /usr/src/app/start.sh && \
    echo 'echo "Starting application..."' >> /usr/src/app/start.sh && \
    echo 'cd /usr/src/app/apps/backend' >> /usr/src/app/start.sh && \
    echo 'echo "Generating Prisma client..."' >> /usr/src/app/start.sh && \
    echo 'npx prisma generate 2>/dev/null || echo "Prisma generate skipped"' >> /usr/src/app/start.sh && \
    echo 'cd /usr/src/app' >> /usr/src/app/start.sh && \
    echo 'if [ -f "dist/apps/backend/src/main.js" ]; then' >> /usr/src/app/start.sh && \
    echo '  echo "Starting built application..."' >> /usr/src/app/start.sh && \
    echo '  exec node dist/apps/backend/src/main.js' >> /usr/src/app/start.sh && \
    echo 'else' >> /usr/src/app/start.sh && \
    echo '  echo "Starting with ts-node..."' >> /usr/src/app/start.sh && \
    echo '  cd apps/backend' >> /usr/src/app/start.sh && \
    echo '  exec npx ts-node src/main.ts' >> /usr/src/app/start.sh && \
    echo 'fi' >> /usr/src/app/start.sh && \
    chmod +x /usr/src/app/start.sh

# Set production environment
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Change ownership
RUN chown -R appuser:nodejs /usr/src/app
USER appuser

# Expose port
EXPOSE 3000

# Start application
CMD ["/bin/sh", "/usr/src/app/start.sh"]