import { Hono } from "hono";
import { HonoEnv } from "../middlewares/authMiddleware";
import { proxyController } from "./bootstrap";

const checkerRoutes = new Hono<HonoEnv>();

checkerRoutes.get("/check/:ips", (c) => proxyController.checkProxies(c));
checkerRoutes.get("/check", (c) => proxyController.checkProxies(c));

export { checkerRoutes };
