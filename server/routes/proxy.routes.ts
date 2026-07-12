import { Hono } from "hono";
import { requireAuth } from "../middlewares/authMiddleware";
import { CreateProxyRequestSchema, UpdateProxyRequestSchema, ImportProxyListSchema } from "../dto/proxy.dto";
import { ProxyController } from "../controllers/ProxyController";
import { validateProxyJson, validateProxyImportJson } from "./bootstrap";
import { HonoEnv } from "../bindings";

const proxyAdminRoutes = new Hono<HonoEnv>();

proxyAdminRoutes.use("*", requireAuth);

proxyAdminRoutes.get("/", (c) => {
  const services = c.get("services");
  const controller = new ProxyController(services.proxyUseCase);
  return controller.getProxies(c);
});

proxyAdminRoutes.post("/", validateProxyJson(CreateProxyRequestSchema), (c) => {
  const services = c.get("services");
  const controller = new ProxyController(services.proxyUseCase);
  return controller.createProxy(c);
});

proxyAdminRoutes.post("/import", validateProxyImportJson(ImportProxyListSchema), (c) => {
  const services = c.get("services");
  const controller = new ProxyController(services.proxyUseCase);
  return controller.importProxies(c);
});

proxyAdminRoutes.post("/sync-health", (c) => {
  const services = c.get("services");
  const controller = new ProxyController(services.proxyUseCase);
  return controller.syncHealth(c);
});

proxyAdminRoutes.get("/geoip", (c) => {
  const services = c.get("services");
  const controller = new ProxyController(services.proxyUseCase);
  return controller.geoipLookup(c);
});

proxyAdminRoutes.put("/:id", validateProxyJson(UpdateProxyRequestSchema), (c) => {
  const services = c.get("services");
  const controller = new ProxyController(services.proxyUseCase);
  return controller.updateProxy(c);
});

proxyAdminRoutes.delete("/:id", (c) => {
  const services = c.get("services");
  const controller = new ProxyController(services.proxyUseCase);
  return controller.deleteProxy(c);
});

export { proxyAdminRoutes };
