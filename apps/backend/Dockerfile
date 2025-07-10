# 1. Base Image for dependencies
FROM node:20-alpine AS deps

# Set working directory
WORKDIR /usr/src/app

# Copy root package files
COPY package.json package-lock.json* ./

# Copy backend package.json
COPY apps/backend/package.json ./apps/backend/

# Install dependencies based on the monorepo structure
RUN npm install --only=production

# 2. Builder Image
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy all package files again for building
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies (including devDependencies)
RUN npm install

# Copy source code and config files
# Monorepo olduğu için, ilgili uygulamanın kaynak kodunu ve prisma şemasını kopyalıyoruz.
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/nest-cli.json ./apps/backend/

# Generate Prisma Client
RUN npx prisma generate --schema=./apps/backend/prisma/schema.prisma

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

# Copy Prisma client
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3000

# Command to run the application (DÜZELTİLMİŞ SATIR)
CMD ["node", "dist/src/main.js"]