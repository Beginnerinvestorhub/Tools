# ==============================================================================
# STANDARDIZED DOCKERFILE FOR THE NODE.JS BACKEND API
# ==============================================================================
# This Dockerfile uses a multi-stage build to create a small and secure
# production image for the backend-api service. It correctly uses pnpm,
# which is the package manager for this monorepo.

# --- Stage 1: Build ---
FROM node:18-alpine AS builder

# Install and enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy all package manifests and the lockfile from the root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy the source code for all packages and apps to resolve workspace dependencies
COPY . .

# Install dependencies and build only the backend-api application.
# The --filter flag targets the specific package by its name in package.json.
# The --frozen-lockfile flag is the pnpm equivalent of 'npm ci'.
RUN pnpm install --frozen-lockfile --filter @beginner-investor-hub/backend-api...
RUN pnpm --filter @beginner-investor-hub/backend-api build

# --- Stage 2: Production ---
FROM node:18-alpine AS runner
WORKDIR /app

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only the built application and its production node_modules from the builder stage.
COPY --from=builder /app/tools/services/backend-api/dist ./dist
COPY --from=builder /app/tools/services/backend-api/node_modules ./node_modules
COPY --from=builder /app/tools/services/backend-api/package.json .

USER appuser

EXPOSE 4000

# The main entrypoint for the NestJS application
CMD ["node", "dist/main"]