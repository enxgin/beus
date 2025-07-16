# Build stage
FROM node:20-alpine AS builder

# Install system dependencies
RUN apk add --no-cache python3 make g++ openssl ca-certificates

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/

# Install all dependencies (including dev)
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy source code
COPY . .

# Build application
RUN npm run build --workspace=backend

# Production stage
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache openssl ca-certificates

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install only production dependencies
RUN npm install --only=production --legacy-peer-deps --no-audit --no-fund

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy Prisma client from builder stage
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma

# Copy prisma schema
COPY --from=builder /usr/src/app/apps/backend/prisma ./apps/backend/prisma

# Set production environment
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Change ownership
RUN chown -R appuser:nodejs /usr/src/app
USER appuser

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/apps/backend/src/main.js"]