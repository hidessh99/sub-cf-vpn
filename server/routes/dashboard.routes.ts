import { Hono } from "hono";
import { requireAuth } from "../middlewares/authMiddleware";
import { DashboardController } from "../controllers/DashboardController";
import { HonoEnv } from "../bindings";

const dashboardRoutes = new Hono<HonoEnv>();

dashboardRoutes.use("*", requireAuth);

dashboardRoutes.get("/stats", (c) => {
  const services = c.get("services");
  const controller = new DashboardController(services.dashboardUseCase);
  return controller.getStats(c);
});

export { dashboardRoutes };
