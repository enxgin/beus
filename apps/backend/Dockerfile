# 1. Base Image for dependencies
FROM node:20-alpine AS deps

# Set working directory
WORKDIR /usr/src/app

# Copy root package files
COPY package.json package-lock.json* ./

# Copy backend package.json
COPY apps/backend/package.json ./apps/backend/

# Install dependencies (including Prisma for production)
RUN npm install --only=production && npm install prisma @prisma/client

# 2. Builder Image
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy all package files again for building
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies (including devDependencies)
RUN npm install

# Copy source code and config files
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/nest-cli.json ./apps/backend/

# Force install the correct prisma version to override any conflicts
RUN npm install -g prisma@6.11.1

# Generate Prisma Client (using the globally installed correct version)
RUN prisma generate --schema=./apps/backend/prisma/schema.prisma

# Build the application
RUN npm run build --workspace=backend

# 3. Production Image
FROM node:20-alpine AS production

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

# Copy Prisma client from builder
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Generate Prisma client in production (fallback)
RUN npx prisma generate --schema=./apps/backend/prisma/schema.prisma || echo "Prisma client already exists"

# Expose port (DÜZELTİLMİŞ SATIR)
EXPOSE 3001

# Command to run the application
CMD ["node", "dist/src/main.js"]