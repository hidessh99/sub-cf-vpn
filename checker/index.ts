import { seed } from './database/seed';
import { handleApiRoute } from './src/routes';
import { config } from "./src/utils/config";
import { logger } from './src/utils/logger';

// Run database init and seed on startup
try {
  logger.info("Running database migrations and seeding...", "System");
  await seed();
  logger.info("Seeding complete.", "System");
} catch (e) {
  logger.error("Failed to seed database", e, "System");
}

const PORT = config.port;

const server = Bun.serve({
  port: PORT,
  async fetch(request: Request): Promise<Response> {
    // Forward all request paths to the centralized handleApiRoute handler
    return handleApiRoute(request);
  }
});

logger.info(`Service running on http://0.0.0.0:${server.port}`, "System");

export default server;
