# Stage 1: Base image and pnpm installation
FROM node:18-alpine AS base
WORKDIR /usr/src/app
RUN npm install -g pnpm

# Stage 2: Install dependencies
FROM base AS deps
# Copy package files from the service directory
COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Stage 3: Build the application
FROM base AS build
# Copy source files
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY src/ ./src/
COPY tsconfig.json ./
COPY jest.config.js ./
COPY nodemon.json ./

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Build the application
RUN pnpm run build

# Stage 4: Production image
FROM node:18-alpine AS production
WORKDIR /usr/src/app

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Copy dependencies and built application
COPY --from=deps --chown=appuser:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=appuser:nodejs /usr/src/app/dist ./dist
COPY --from=build --chown=appuser:nodejs /usr/src/app/package.json ./package.json

# Copy healthcheck file
COPY --chown=appuser:nodejs healthcheck.js ./

# Switch to non-root user
USER appuser

# Use environment variable for port (Render will set this)
ENV PORT=4000
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node healthcheck.js || exit 1

# Command to run the application
CMD ["node", "dist/server.js"]