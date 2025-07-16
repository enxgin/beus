FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy all package.json files first for better caching
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/

# Set npm configuration
RUN npm config set registry https://registry.npmjs.org/
RUN npm config set fetch-retry-mintimeout 20000
RUN npm config set fetch-retry-maxtimeout 120000

# Install all dependencies (including dev for build)
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy prisma schema and generate client
COPY apps/backend/prisma ./apps/backend/prisma
RUN cd apps/backend && npx prisma generate

# Copy all source code
COPY . .

# Build the application
RUN npm run build --workspace=backend

# Clean up dev dependencies
RUN npm prune --production

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node --version || exit 1

# Start the application
CMD ["node", "dist/apps/backend/src/main.js"]