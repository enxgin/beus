#
# FINAL DOCKERFILE - SINGLE STAGE OFFLINE BUILD
# This is the most robust solution, bypassing all potential ignore/cache issues.
#

FROM node:20-alpine

WORKDIR /usr/src/app

# Install OS packages needed for Prisma (binary) and Healthcheck (curl)
RUN apk add --no-cache curl openssl

# Copy ALL project files. .dockerignore is disabled, so node_modules will be included.
COPY . .

# Build the application inside the container using the copied node_modules
RUN echo "=== Starting Final Offline Build ===" && \
    cd apps/backend && \
    echo "--- Running Prisma Generate ---" && \
    ../../node_modules/.bin/prisma generate --schema=./prisma/schema.prisma || (echo "Prisma Generate FAILED"; exit 1) && \
    echo "--- Prisma Generate Successful ---" && \
    echo "--- Running NestJS Build ---" && \
    ../../node_modules/.bin/nest build || (echo "NestJS Build FAILED"; exit 1) && \
    echo "--- NestJS Build Successful ---" && \
    cd /usr/src/app && \
    echo "=== Final Offline Build Completed Successfully ==="

# Prune development dependencies for a smaller final image
RUN npm prune --production

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