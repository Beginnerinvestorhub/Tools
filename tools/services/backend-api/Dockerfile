# This Dockerfile is designed for a pnpm monorepo and MUST be built from the repository root.
# Your render.yaml has been updated to do this automatically.

# ---- Base ----
# Use a consistent base image.
FROM node:18-alpine AS base
# Use the pnpm version from your package.json for consistency.
RUN npm install -g pnpm@8.15.5
WORKDIR /app

# ---- Dependencies ----
# This stage copies only package manifests and installs all dependencies.
# This layer is cached and only re-built when dependencies change.
FROM base AS deps

# Copy the root manifests first.
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy all package.json files from the monorepo workspaces to leverage caching.
# This is more granular than copying the whole directories.
COPY packages/api-types/package.json ./packages/api-types/
COPY tools/apps/web/package.json ./tools/apps/web/
COPY tools/services/backend-api/package.json ./tools/services/backend-api/

# Install ALL dependencies for the entire monorepo.
# --frozen-lockfile is crucial for reproducible builds in CI/CD.
RUN pnpm install --frozen-lockfile

# ---- Builder ----
# This stage builds the target service using the pre-installed dependencies.
# It copies the full source code, so it will be re-built on any code change.
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Use pnpm's filter to build only the backend-api and its workspace dependencies.
# The package name must match the "name" field in its package.json.
RUN pnpm --filter @beginnerinvestorhub/backend-api... build

# ---- Pruner ----
# Create a pruned, production-only build of just our service.
FROM builder AS pruner

# Use pnpm deploy to copy only the necessary production files to a new directory.
RUN pnpm deploy --filter @beginnerinvestorhub/backend-api --prod /prod

# ---- Final Production Image ----
FROM node:18-alpine AS final

ENV NODE_ENV=production
WORKDIR /usr/src/app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs
USER appuser

# Copy the pruned production files from the pruner stage.
COPY --from=pruner --chown=appuser:nodejs /prod/ .

# Copy the healthcheck file from its location in the monorepo.
# The path in the COPY command is relative to the build context root.
COPY --chown=appuser:nodejs ./tools/services/backend-api/healthcheck.js ./

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node healthcheck.js || exit 1

# The command to run the application. The path is relative to the pruned output.
CMD ["node", "dist/server.js"]
