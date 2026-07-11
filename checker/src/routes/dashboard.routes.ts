import { Hono } from "hono";
import { HonoEnv, requireAuth } from "../middlewares/authMiddleware";
import { dashboardController } from "./bootstrap";

const dashboardRoutes = new Hono<HonoEnv>();

dashboardRoutes.use("*", requireAuth);

dashboardRoutes.get("/stats", (c) => dashboardController.getStats(c));

export { dashboardRoutes };
