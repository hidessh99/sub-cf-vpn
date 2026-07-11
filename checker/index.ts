import { seed } from './database/seed';
import { handleApiRoute } from './src/routes';
import { config } from "./src/utils/config";
import { logger } from './src/utils/logger';
import { db } from './database/database';

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

// Graceful Shutdown implementation
const shutdown = async () => {
  logger.info("Shutdown signal received. Closing resources...", "System");
  
  // 1. Stop Bun server
  server.stop();
  logger.info("HTTP server stopped accepting new connections.", "System");

  // 2. Close SQLite connection
  try {
    db.close();
    logger.info("SQLite database connection closed safely.", "System");
  } catch (err) {
    logger.error("Error closing SQLite connection", err, "System");
  }

  logger.info("Graceful shutdown complete. Exiting process.", "System");
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export default server;
