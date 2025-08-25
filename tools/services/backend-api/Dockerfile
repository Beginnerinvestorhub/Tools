# Stage 1: Base image and pnpm installation
FROM node:18-alpine AS base
WORKDIR /usr/src/app
RUN npm install -g pnpm

# Stage 2: Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Stage 3: Build the application
FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build

# Stage 4: Production image
FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

# Expose the port defined in render.yaml
EXPOSE 4000

# Command to run the application
CMD [ "node", "dist/server.js" ]