import { Hono } from "hono";
import { SystemController } from "../controllers/SystemController";
import { HonoEnv } from "../bindings";

const systemRoutes = new Hono<HonoEnv>();

const controller = new SystemController();

systemRoutes.get("/", (c) => controller.healthCheck(c));
systemRoutes.get("/health", (c) => controller.healthCheck(c));

export { systemRoutes };
