import { seed } from './database/seed';
import { app } from './src/app';
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
  fetch: app.fetch
});

logger.info(`Service running on http://0.0.0.0:${server.port}`, "System");

// Graceful Shutdown implementation
const shutdown = async () => {
  logger.info("Shutdown signal received. Starting graceful shutdown...", "System");
  
  // 1. Stop Bun server from accepting new connections
  server.stop(false);
  logger.info("HTTP server stopped accepting new connections. Allowing active requests to drain...", "System");

  // 2. Wait for 2 seconds to allow in-flight requests to complete
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 3. Close SQLite connection
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
