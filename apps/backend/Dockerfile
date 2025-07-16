# 1. Base Image for dependencies
FROM node:20-alpine AS deps

# Set working directory
WORKDIR /usr/src/app

# Copy root package files
COPY package.json package-lock.json* ./

# Copy backend package.json
COPY apps/backend/package.json ./apps/backend/

# Install dependencies (including Prisma for production) with network optimizations
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --only=production && npm install prisma @prisma/client

# 2. Builder Image
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy all package files again for building
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies (including devDependencies) with network optimizations
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install

# Copy source code and config files
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/nest-cli.json ./apps/backend/

# Copy pre-generated Prisma client from local build context
COPY apps/backend/node_modules/@prisma/client ./apps/backend/node_modules/@prisma/client
COPY apps/backend/node_modules/.prisma ./apps/backend/node_modules/.prisma

# Verify Prisma client exists, generate only if missing
RUN if [ ! -d "./node_modules/@prisma/client" ]; then \
        echo "Pre-generated Prisma client not found, generating..."; \
        if [ -f "./node_modules/.bin/prisma" ]; then \
            echo "Using local prisma binary"; \
            ./node_modules/.bin/prisma generate --schema=./apps/backend/prisma/schema.prisma; \
        else \
            echo "Trying npx with retries"; \
            for i in 1 2 3; do \
                npm config set registry https://registry.npmjs.org/ && \
                npm config set fetch-timeout 300000 && \
                npm config set fetch-retry-mintimeout 20000 && \
                npm config set fetch-retry-maxtimeout 120000 && \
                npx prisma generate --schema=./apps/backend/prisma/schema.prisma && break || \
                (echo "Attempt $i failed, retrying..." && sleep 10); \
            done; \
        fi; \
    else \
        echo "Using pre-generated Prisma client"; \
    fi

# Build the application
RUN npm run build --workspace=backend

# 3. Production Image
FROM node:20-alpine AS production

# Install OpenSSL for Prisma native engine
RUN apk add --no-cache openssl

# Set environment variables
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy production dependencies from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/package.json ./
COPY --from=deps /usr/src/app/apps/backend/package.json ./apps/backend/

# Copy built application from builder stage
COPY --from=builder /usr/src/app/apps/backend/dist ./dist

# Copy Prisma schema for generation
COPY --from=builder /usr/src/app/apps/backend/prisma ./apps/backend/prisma

# Copy Prisma client from builder (both .prisma and @prisma directories)
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma

# Verify Prisma client exists in production, generate only if absolutely necessary
RUN if [ ! -d "./node_modules/@prisma/client" ] && [ ! -d "./node_modules/.prisma" ]; then \
        echo "No Prisma client found in production, attempting generation..."; \
        if [ -f "./node_modules/.bin/prisma" ]; then \
            echo "Using local prisma binary for production"; \
            ./node_modules/.bin/prisma generate --schema=./apps/backend/prisma/schema.prisma || echo "Prisma client generation failed"; \
        else \
            echo "Trying npx prisma with retries in production"; \
            for i in 1 2 3; do \
                npm config set registry https://registry.npmjs.org/ && \
                npm config set fetch-timeout 300000 && \
                npm config set fetch-retry-mintimeout 20000 && \
                npm config set fetch-retry-maxtimeout 120000 && \
                npx prisma generate --schema=./apps/backend/prisma/schema.prisma && break || \
                (echo "Production attempt $i failed, retrying..." && sleep 10); \
            done || echo "Prisma client generation failed, using existing client"; \
        fi; \
    else \
        echo "Using existing Prisma client in production"; \
    fi

# Expose port (DÜZELTİLMİŞ SATIR)
EXPOSE 3001

# Command to run the application
CMD ["node", "dist/src/main.js"]