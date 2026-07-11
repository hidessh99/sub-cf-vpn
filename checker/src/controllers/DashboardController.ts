import { Context } from "hono";
import { DashboardUseCase } from "../usecases/DashboardUseCase";
import { logger } from "../utils/logger";

export class DashboardController {
  constructor(private dashboardUseCase: DashboardUseCase) {}

  async getStats(c: Context): Promise<Response> {
    const admin = c.get("admin");
    if (!admin) {
      logger.warn("getStats attempt without authorization", "DashboardController");
      return c.json({ success: false, message: "Unauthorized", error: null }, 401);
    }

    const stats = this.dashboardUseCase.getStats();

    return c.json({
      success: true,
      message: "Dashboard stats retrieved successfully",
      data: stats
    });
  }
}
