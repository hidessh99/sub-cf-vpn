FROM oven/bun:1-alpine AS runner

WORKDIR /app

# Copy package manifest and lockfiles
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --production

# Copy source code and directories
COPY . .

# Expose checker port
EXPOSE 4002

# Environment variables
ENV NODE_ENV=production
ENV PORT=4002

# Volume for database persistence
VOLUME ["/app/data"]

# Run the checker microservice with Bun
CMD ["bun", "run", "index.ts"]
