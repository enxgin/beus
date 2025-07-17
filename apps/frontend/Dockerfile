# 1. Base Image for dependencies
FROM node:20-alpine AS deps

WORKDIR /usr/src/app

# Install dependencies for better caching
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/frontend/next.config.js ./apps/frontend/

# Install all dependencies
RUN npm install

# 2. Builder Image
FROM node:20-alpine AS builder

ENV NEXT_PUBLIC_API_URL=https://api.rezervgo.com

WORKDIR /usr/src/app

# Install dependencies for better caching
RUN apk add --no-cache libc6-compat

# Copy installed dependencies
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/package.json ./
COPY --from=deps /usr/src/app/apps/frontend/package.json ./apps/frontend/
COPY --from=deps /usr/src/app/apps/frontend/next.config.js ./apps/frontend/

# Copy source code
COPY . .

# Build the frontend application using the workspace script
# We stay at /usr/src/app because root node_modules already contains Next.js
RUN npm run build:frontend

# 3. Production Image
FROM node:20-alpine AS production

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=https://api.rezervgo.com

WORKDIR /usr/src/app

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone build output from the builder stage
COPY --from=builder /usr/src/app/apps/frontend/.next/standalone ./

# Copy the static assets
COPY --from=builder /usr/src/app/apps/frontend/public ./apps/frontend/public

# Copy the cached images (optional, but good for performance)
COPY --from=builder /usr/src/app/apps/frontend/.next/static ./apps/frontend/.next/static

# Change ownership to the non-root user
RUN chown -R nextjs:nodejs .

# Switch to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# The command to start the app
CMD ["node", "apps/frontend/server.js"]