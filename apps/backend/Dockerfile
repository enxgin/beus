#
# FINAL OPTIMIZED DOCKERFILE FOR UNSTABLE NETWORKS (COOLIFY)
# Strategy: Build-Time is for copying files only. All installations and builds happen at Runtime.
#

# ----------------- BASE STAGE -----------------
# This stage just copies the source code. No network operations.
FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY . .

# ----------------- PRODUCTION STAGE -----------------
# This stage prepares the final image and runs the application.
FROM node:20-alpine AS production

# Install essential OS packages for runtime
RUN apk add --no-cache curl openssl ca-certificates

WORKDIR /usr/src/app

# Copy all source code from the base stage
COPY --from=base /usr/src/app .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Create a robust startup script that handles everything at runtime
RUN echo '#!/bin/sh' > /usr/src/app/start.sh && \
    echo 'set -e' >> /usr/src/app/start.sh && \
    echo 'echo "====== BEU Backend Runtime Initializer ======"' >> /usr/src/app/start.sh && \
    echo '' >> /usr/src/app/start.sh && \
    \
    echo '# 1. Install Dependencies (with retries)' >> /usr/src/app/start.sh && \
    echo 'if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/prisma" ]; then' >> /usr/src/app/start.sh && \
    echo '  echo "Dependencies not found. Installing..."' >> /usr/src/app/start.sh && \
    echo '  for i in 1 2 3; do' >> /usr/src/app/start.sh && \
    echo '    npm install --legacy-peer-deps --no-audit --no-fund && break' >> /usr/src/app/start.sh && \
    echo '    echo "npm install failed, retrying in 10 seconds..."' >> /usr/src/app/start.sh && \
    echo '    sleep 10' >> /usr/src/app/start.sh && \
    echo '  done' >> /usr/src/app/start.sh && \
    echo 'fi' >> /usr/src/app/start.sh && \
    echo 'echo "Dependency check complete."' >> /usr/src/app/start.sh && \
    echo '' >> /usr/src/app/start.sh && \
    \
    echo '# 2. Generate Prisma Client' >> /usr/src/app/start.sh && \
    echo 'echo "Generating Prisma client..."' >> /usr/src/app/start.sh && \
    echo 'cd apps/backend' >> /usr/src/app/start.sh && \
    echo '../../node_modules/.bin/prisma generate --schema=./prisma/schema.prisma' >> /usr/src/app/start.sh && \
    echo 'cd /usr/src/app' >> /usr/src/app/start.sh && \
    echo 'echo "Prisma client generated."' >> /usr/src/app/start.sh && \
    echo '' >> /usr/src/app/start.sh && \
    \
    echo '# 3. Build NestJS Application' >> /usr/src/app/start.sh && \
    echo 'echo "Building NestJS application..."' >> /usr/src/app/start.sh && \
    echo 'cd apps/backend' >> /usr/src/app/start.sh && \
    echo '../../node_modules/.bin/nest build' >> /usr/src/app/start.sh && \
    echo 'cd /usr/src/app' >> /usr/src/app/start.sh && \
    echo 'echo "NestJS application built."' >> /usr/src/app/start.sh && \
    echo '' >> /usr/src/app/start.sh && \
    \
    echo '# 4. Start Application' >> /usr/src/app/start.sh && \
    echo 'echo "Starting application..."' >> /usr/src/app/start.sh && \
    echo 'exec node apps/backend/dist/src/main.js' >> /usr/src/app/start.sh && \
    \
    chmod +x /usr/src/app/start.sh

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs && \
    chown -R appuser:nodejs /usr/src/app

USER appuser

# Healthcheck to ensure the application is running
HEALTHCHECK --interval=20s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Expose port and start the application
EXPOSE 3001
CMD ["/bin/sh", "/usr/src/app/start.sh"]