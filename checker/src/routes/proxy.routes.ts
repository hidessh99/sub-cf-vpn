import { Hono } from "hono";
import { HonoEnv, requireAuth } from "../middlewares/authMiddleware";
import { CreateProxyRequestSchema, UpdateProxyRequestSchema, ImportProxyListSchema } from "../dto/proxy.dto";
import { proxyController, validateProxyJson, validateProxyImportJson } from "./bootstrap";

const proxyAdminRoutes = new Hono<HonoEnv>();

proxyAdminRoutes.use("*", requireAuth);

proxyAdminRoutes.get("/", (c) => proxyController.getProxies(c));
proxyAdminRoutes.post("/", validateProxyJson(CreateProxyRequestSchema), (c) => proxyController.createProxy(c));
proxyAdminRoutes.post("/import", validateProxyImportJson(ImportProxyListSchema), (c) => proxyController.importProxies(c));
proxyAdminRoutes.post("/sync-health", (c) => proxyController.syncHealth(c));
proxyAdminRoutes.get("/geoip", (c) => proxyController.geoipLookup(c));

proxyAdminRoutes.put("/:id", validateProxyJson(UpdateProxyRequestSchema), (c) => proxyController.updateProxy(c));
proxyAdminRoutes.delete("/:id", (c) => proxyController.deleteProxy(c));

export { proxyAdminRoutes };
