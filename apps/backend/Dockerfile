FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl \
    ca-certificates

WORKDIR /usr/src/app

# Set npm configuration for better reliability
ENV NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=30000
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=180000
ENV NPM_CONFIG_FETCH_RETRIES=10

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/

# Install dependencies with retry logic
RUN npm cache clean --force && \
    for i in 1 2 3 4 5; do \
        npm install --legacy-peer-deps --no-audit --no-fund && break || \
        (echo "Install attempt $i failed, retrying in 30 seconds..." && sleep 30); \
    done

# Copy source code
COPY . .

# Build application (prebuild will run prisma generate automatically)
RUN npm run build --workspace=backend

# Clean up dev dependencies
RUN npm prune --production

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
CMD ["node", "dist/apps/backend/src/main.js"]