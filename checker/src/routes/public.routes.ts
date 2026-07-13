import { Hono } from "hono";
import { HonoEnv } from "../middlewares/authMiddleware";
import { proxyController, domainController, bugController } from "./bootstrap";

const publicRoutes = new Hono<HonoEnv>();

publicRoutes.get("/proxies", (c) => proxyController.getPublicProxies(c));
publicRoutes.get("/proxies/grouped", (c) => proxyController.getPublicProxiesGrouped(c));
publicRoutes.get("/domains", (c) => domainController.getPublicDomains(c));
publicRoutes.get("/bugs", (c) => bugController.getPublicBugs(c));

export { publicRoutes };
