FROM oven/bun:1-alpine AS runner

WORKDIR /app

# Copy package.json and source code
COPY package.json index.ts ./

# Expose checker port
EXPOSE 4002

# Run the checker microservice with Bun
CMD ["bun", "run", "index.ts"]
