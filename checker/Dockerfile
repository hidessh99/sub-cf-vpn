# Stage 1: Build & install dependencies
FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --production

# Stage 2: Production runner
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Copy production packages and node_modules from builder
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy only required source code
COPY src/ ./src
COPY database/ ./database
COPY index.ts ./

# Expose checker port
EXPOSE 4002

# Environment variables
ENV NODE_ENV=production
ENV PORT=4002

# Volume for database persistence
VOLUME ["/app/data"]

# Run the checker microservice with Bun
CMD ["bun", "run", "index.ts"]
