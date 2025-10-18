# ------------------
# STAGE 1: BASE
# This stage creates our cached node_modules layer.
# Both development and production will build FROM this.
# ------------------
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Use 'npm ci' for clean, fast, reproducible installs
RUN npm ci

# ------------------
# STAGE 2: PRODUCTION
# This stage is for building a small, optimized image for deployment.
# We will copy the cached dependencies from 'base'.
# ------------------
FROM base AS production

# Copy the rest of your application code
# The .dockerignore file will prevent node_modules, .env, etc., from being copied.
COPY . .

# Build the TypeScript application
RUN npm run build

# Remove development dependencies to shrink the image size
RUN npm prune --production

EXPOSE 6006

# Command to run the compiled application in production
CMD ["node", "dist/app.js"]

# ------------------
# STAGE 3: DEVELOPMENT
# This is the target your docker-compose.yml will use.
# It uses the cached dependencies from 'base' but runs a dev server.
# ------------------
FROM base AS development

# Copy the rest of your application code. This ensures the container has the
# code to start up, even before the volume is mounted.
COPY . .

EXPOSE 6006

# Command to run the development server with hot-reloading.
# Your docker-compose volume will keep the 'src' directory in sync.
# Ensure your package.json has a "dev" script.
CMD ["npm", "run", "dev"]