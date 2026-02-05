# =============================================================================
# Stage 1: Install npm dependencies and build the React Router app
# =============================================================================
FROM docker.io/node:25-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY app ./app
COPY public ./public
COPY vite ./vite
COPY types ./types
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY react-router.config.ts ./
COPY svgr.config.js ./
COPY site.config.ts ./

# Build the application
RUN BUILD_TARGET=deno npm run build

# =============================================================================
# Stage 2: Compile Deno server into standalone binary
# =============================================================================
FROM docker.io/denoland/deno:2.6.4 AS compiler

WORKDIR /app

# Copy deno config and server
COPY deno.json ./
COPY server.ts ./

# Copy package.json for npm dependency resolution
COPY package.json ./

# Copy the built application from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules

# Cache dependencies
RUN deno install \
    --node-modules-dir=manual

# Compile to standalone binary with embedded assets
# --include embeds the entire build directory into the binary
# --unstable-bare-node-builtins allows imports like 'fs' instead of 'node:fs'
RUN deno compile \
    --allow-net \
    --allow-read \
    --allow-env \
    --unstable-bare-node-builtins \
    --include=build \
    --output=rfd-server \
    --node-modules-dir=manual \
    --allow-sys \
    server.ts

FROM docker.io/debian:12-slim as tools

RUN apt update -y && apt install tini -y
# =============================================================================
# Stage 3: Create minimal Alpine image
# =============================================================================
FROM docker.io/debian:12-slim

# Copy the compiled binary (includes embedded static assets)
COPY --from=compiler /app/rfd-server /rfd-server
COPY --from=tools /usr/bin/tini /tini

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Expose the port
EXPOSE 3000

# Run the server
ENTRYPOINT ["/tini", "/rfd-server"]
