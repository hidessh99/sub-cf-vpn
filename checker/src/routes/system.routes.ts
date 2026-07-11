import { Hono } from "hono";
import { HonoEnv } from "../middlewares/authMiddleware";
import { systemController } from "./bootstrap";

const systemRoutes = new Hono<HonoEnv>();

systemRoutes.get("/", (c) => systemController.healthCheck(c));
systemRoutes.get("/health", (c) => systemController.healthCheck(c));

export { systemRoutes };
