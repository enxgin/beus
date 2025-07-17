# 1. Base Image for dependencies
FROM node:20-alpine AS deps

WORKDIR /usr/src/app

# Install pnpm and other dependencies
RUN apk add --no-cache libc6-compat wget
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="/root/.shrc" SHELL="$(which sh)" sh -
# Add pnpm to the PATH for subsequent RUN instructions
ENV PATH=/root/.local/share/pnpm:$PATH

# Copy package files, the lockfile, and the npmrc configuration
COPY .npmrc package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/frontend/next.config.js ./apps/frontend/

# Force Node.js to prefer IPv4 to prevent timeouts in broken IPv6 environments
ENV NODE_OPTIONS=--dns-result-order=ipv4first

# Install dependencies using the lockfile for fast and reliable builds
RUN pnpm install --frozen-lockfile

# 2. Builder Image
FROM node:20-alpine AS builder

ENV NEXT_PUBLIC_API_URL=https://api.rezervgo.com

WORKDIR /usr/src/app

# Copy the entire dependency structure from the deps stage
COPY --from=deps /usr/src/app .

# Copy the rest of the source code
COPY . .

# Re-install pnpm in the builder stage and set the PATH
RUN apk add --no-cache libc6-compat wget
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="/root/.shrc" SHELL="$(which sh)" sh -
ENV PATH=/root/.local/share/pnpm:$PATH


# Build the frontend application using pnpm
RUN pnpm --filter frontend build

# 3. Production Image
FROM node:20-alpine AS production

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=https://api.rezervgo.com
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

WORKDIR /usr/src/app

# Install curl and wget for healthcheck probes
RUN apk add --no-cache curl wget

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