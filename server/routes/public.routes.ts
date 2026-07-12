import { Hono } from "hono";
import { ProxyController } from "../controllers/ProxyController";
import { DomainController } from "../controllers/DomainController";
import { BugController } from "../controllers/BugController";
import { HonoEnv } from "../bindings";

const publicRoutes = new Hono<HonoEnv>();

publicRoutes.get("/proxies", (c) => {
  const services = c.get("services");
  const controller = new ProxyController(services.proxyUseCase);
  return controller.getPublicProxies(c);
});

publicRoutes.get("/proxies/grouped", (c) => {
  const services = c.get("services");
  const controller = new ProxyController(services.proxyUseCase);
  return controller.PublicProxi(c);
});

publicRoutes.get("/domains", (c) => {
  const services = c.get("services");
  const controller = new DomainController(services.domainUseCase);
  return controller.getPublicDomains(c);
});

publicRoutes.get("/bugs", (c) => {
  const services = c.get("services");
  const controller = new BugController(services.bugUseCase);
  return controller.getPublicBugs(c);
});

export { publicRoutes };
