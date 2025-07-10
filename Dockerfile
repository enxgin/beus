# Production Dockerfile for Backend
FROM node:18-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN cd apps/backend && npx prisma generate

# Build the application
RUN cd apps/backend && npm run build

# Production stage
FROM node:18-alpine AS production

# Install OpenSSL for Prisma native engine
RUN apk add --no-cache openssl

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install production dependencies including Prisma
RUN npm ci --only=production
RUN npm install prisma @prisma/client

# Copy built application
COPY --from=builder /usr/src/app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /usr/src/app/apps/backend/prisma ./apps/backend/prisma

# Generate Prisma client in production
RUN npx prisma generate --schema=./apps/backend/prisma/schema.prisma || echo "Prisma client already exists"

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "apps/backend/dist/main.js"]