#
# FINAL VENDORIZED DOCKERFILE FOR OFFLINE BUILDS
# Strategy: All node_modules are copied directly into the image. No network needed during build or runtime install.
#

# ----------------- BUILDER STAGE -----------------
# This stage takes all local files, including node_modules, and builds the app.
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy ALL files from local, including the pre-installed node_modules
COPY . .

# Generate Prisma Client and Build Application using the copied node_modules
RUN echo "=== Starting Offline Build ===" && \
    echo "--- Listing root directory ---" && \
    ls -la /usr/src/app && \
    echo "--- Listing node_modules directory ---" && \
    ls -la /usr/src/app/node_modules/.bin && \
    cd apps/backend && \
    echo "--- Running Prisma Generate from $(pwd) ---" && \
    ../../node_modules/.bin/prisma generate --schema=./prisma/schema.prisma || (echo "Prisma Generate FAILED"; exit 1) && \
    echo "--- Prisma Generate Successful ---" && \
    echo "--- Running NestJS Build ---" && \
    ../../node_modules/.bin/nest build || (echo "NestJS Build FAILED"; exit 1) && \
    echo "--- NestJS Build Successful ---" && \
    cd /usr/src/app && \
    echo "=== Offline Build Completed Successfully ==="

# ----------------- PRODUCTION STAGE -----------------
# This stage creates the final, lean image for production.
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Install only necessary OS packages
RUN apk add --no-cache curl openssl

# Copy production-necessary files from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /usr/src/app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/apps/backend/package.json ./apps/backend/

# Create a non-root user for security
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