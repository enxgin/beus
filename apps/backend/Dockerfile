#
# FINAL DOCKERFILE - PROPER MULTI-STAGE VENDORIZED BUILD
# Strategy: Isolate dependency installation in its own stage to leverage Docker caching
# and copy the result into the builder, avoiding context/ignore issues.
#

# ----------------- DEPENDENCY STAGE -----------------
# This stage's only job is to install node_modules based on package.json files.
# It will be cached by Docker as long as package.json doesn't change.
FROM node:20-alpine AS deps

WORKDIR /usr/src/app

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/

# Install yarn first, then use it for more stable dependency installation
# Fallback to npm if yarn fails
RUN npm install -g yarn --no-audit --no-fund && \
    yarn config set network-timeout 300000 && \
    yarn config set network-concurrency 1 && \
    yarn install --frozen-lockfile --network-timeout 300000 || \
    yarn install --network-timeout 300000 || \
    npm install --legacy-peer-deps --no-audit --no-fund --maxsockets=1 --network-timeout=300000

# ----------------- BUILDER STAGE -----------------
# This stage builds the application using the pre-installed dependencies.
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy dependencies from the 'deps' stage
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy the rest of the source code
COPY . .

# Generate Prisma Client and Build Application
RUN cd apps/backend && \
    ../../node_modules/.bin/prisma generate --schema=./prisma/schema.prisma && \
    ../../node_modules/.bin/nest build

# ----------------- PRODUCTION STAGE -----------------
# This is the final, lean image.
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Install only necessary OS packages
RUN apk add --no-cache curl openssl

# Prune dev dependencies from the builder's node_modules before copying
COPY --from=builder /usr/src/app/node_modules ./node_modules
RUN npm prune --production

# Copy the built application and other necessary files from the builder stage
COPY --from=builder /usr/src/app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /usr/src/app/apps/backend/prisma/schema.prisma ./apps/backend/prisma/schema.prisma
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/apps/backend/package.json ./apps/backend/

# Create and switch to a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs && \
    chown -R appuser:nodejs /usr/src/app
USER appuser

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Healthcheck to ensure the application is running
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Expose port and start the application
EXPOSE 3001
CMD ["node", "apps/backend/dist/src/main.js"]