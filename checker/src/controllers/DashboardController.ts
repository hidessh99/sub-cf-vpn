import { Context } from "hono";
import { IDashboardUseCase } from "../usecases/interfaces";

export class DashboardController {
  constructor(private dashboardUseCase: IDashboardUseCase) {}

  async getStats(c: Context): Promise<Response> {
    const admin = c.get("admin");
    if (!admin) {
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
