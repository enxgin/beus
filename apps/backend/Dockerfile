# Stage 1: Install dependencies and generate Prisma Client
# This stage is responsible for installing all dependencies and generating the Prisma client.
# It is kept separate to leverage Docker's layer caching effectively.
FROM node:20-alpine AS dependencies

WORKDIR /usr/src/app

# Configure npm for more robust network operations in CI environments
RUN npm config set fetch-retries 5
RUN npm config set fetch-timeout 120000

# Copy all package.json and lock files to leverage cache
COPY package.json ./
COPY package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Copy the Prisma schema, which is required for generating the client
COPY apps/backend/prisma/ ./apps/backend/prisma/

# Use 'npm ci' for faster, more reliable builds in CI environments
RUN npm ci

# Generate the Prisma Client based on the schema
# This ensures the client is tailored to your database structure
RUN npm exec prisma -- generate --schema=./apps/backend/prisma/schema.prisma


# Stage 2: Build the application
# This stage takes the source code and the installed dependencies to build the production-ready application.
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy all source code into the builder
COPY . .

# Copy the pre-installed node_modules from the 'dependencies' stage
COPY --from=dependencies /usr/src/app/node_modules ./node_modules

# Build the backend application using npm workspaces
# This command compiles the TypeScript code into JavaScript.
RUN npm run build --workspace=backend


# Stage 3: Create the final production image
# This stage creates a lean production image with only the necessary files to run the application.
FROM node:20-alpine AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Configure npm for more robust network operations in CI environments
RUN npm config set fetch-retries 5
RUN npm config set fetch-timeout 120000

# Copy package files to install only production dependencies
COPY package.json ./
COPY package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/

# Install only production dependencies to keep the image size small
RUN npm ci --omit=dev

# Copy the generated Prisma client and query engine from the 'dependencies' stage.
# This is the key step to avoid running 'prisma generate' at runtime.
# Note: We copy both .prisma/client and @prisma/client to be safe.
COPY --from=dependencies /usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=dependencies /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy the built application from the 'builder' stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy the prisma schema file. The Prisma client needs it at runtime to locate the query engine.
COPY apps/backend/prisma/schema.prisma ./apps/backend/prisma/schema.prisma

# Expose the port the application will run on
EXPOSE 3001

# The command to start the application in production mode
CMD ["node", "dist/apps/backend/src/main.js"]