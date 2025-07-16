# Stage 1: Build the application and all its dependencies
# This stage installs ALL dependencies (dev included) to be able to build the project
# and generate the prisma client artifacts.
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Copy all necessary package and lock files
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Copy prisma schema
COPY apps/backend/prisma ./apps/backend/prisma

# Install ALL dependencies. This is necessary for the build step and for prisma client generation.
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the backend application
RUN npm run build --workspace=backend


# Stage 2: Create the final, lean production image
# This stage creates a minimal image with only production dependencies and built artifacts.
FROM node:20-slim AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy only the necessary package and lock files for production
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/

# Install ONLY production dependencies to keep the image small
RUN npm ci --omit=dev

# Copy the built application from the 'builder' stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy the pre-generated Prisma client and its engine from the 'builder' stage.
# This is the key step to completely avoid running 'prisma generate' in production.
COPY --from=builder /usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /usr/src/app/apps/backend/prisma/schema.prisma ./apps/backend/prisma/schema.prisma

# Expose the port the application will run on
EXPOSE 3000

# The command to start the application
CMD ["node", "dist/apps/backend/src/main.js"]