import { Context } from "hono";
import { Database } from "bun:sqlite";
import { logger } from "../utils/logger";

export class SystemController {
  constructor(private db: Database) {}

  async healthCheck(c: Context): Promise<Response> {
    let dbStatus = "ok";
    try {
      this.db.query("SELECT 1").get();
    } catch (err: any) {
      dbStatus = "error";
      logger.error("Health check failed - database connection issue", err, "SystemController");
    }

    const overallStatus = dbStatus === "ok" ? "ok" : "degraded";

    return c.json(
      {
        status: overallStatus,
        service: "lufeng-vpn-checker",
        runtime: "bun",
        details: {
          database: dbStatus
        }
      },
      overallStatus === "ok" ? 200 : 503
    );
  }
}
