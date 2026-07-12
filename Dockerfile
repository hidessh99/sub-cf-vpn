# Stage 1: Build the React application with Bun
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package manifest and lockfiles, then install dependencies using Bun
COPY package*.json bun.lock* ./
RUN bun install

# Copy source code and configuration files
COPY . .

# Accept build arguments for environment customization (12-factor app)
ARG VITE_PROXY_LIST_URL
ARG VITE_API_CHECK_URL
ARG VITE_PATH_TEMPLATE
ARG VITE_WEB_NAME

# Set environment variables for Vite during build
ENV VITE_PROXY_LIST_URL=$VITE_PROXY_LIST_URL
ENV VITE_API_CHECK_URL=$VITE_API_CHECK_URL
ENV VITE_PATH_TEMPLATE=$VITE_PATH_TEMPLATE
ENV VITE_WEB_NAME=$VITE_WEB_NAME

# Build static files using Bun
RUN bun run build

# Stage 2: Serve static files with lightweight Nginx
FROM nginx:alpine-slim

# Copy custom optimized Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Clean default Nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port 4001
EXPOSE 4001

# Healthcheck to verify container liveliness
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4001/ || exit 1

# Launch Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
