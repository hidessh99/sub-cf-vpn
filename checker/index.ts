import { seed } from './database/seed';
import { handleApiRoute } from './src/routes';
import { config } from "./src/utils/config";

// Run database init and seed on startup
try {
  console.log("⚙️  [System] Running database migrations and seeding...");
  await seed();
  console.log("⚙️  [System] Seeding complete.");
} catch (e) {
  console.error("⚠️  [System] Failed to seed database:", e);
}

const PORT = config.port;

const server = Bun.serve({
  port: PORT,
  async fetch(request: Request): Promise<Response> {
    // Forward all request paths to the centralized handleApiRoute handler
    return handleApiRoute(request);
  }
});

console.log(`🚀 [LuFeng Checker] Service running on http://0.0.0.0:${server.port}`);

export default server;
