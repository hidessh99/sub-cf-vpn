import { Hono } from "hono";
import { HonoEnv } from "../middlewares/authMiddleware";
import { proxyController } from "./bootstrap";
import { checkerRateLimiter } from "../middlewares/rateLimiter";

const checkerRoutes = new Hono<HonoEnv>();

checkerRoutes.use("/check*", checkerRateLimiter);
checkerRoutes.get("/check/:ips", (c) => proxyController.checkProxies(c));
checkerRoutes.get("/check", (c) => proxyController.checkProxies(c));

export { checkerRoutes };
