import { Hono } from "hono";
import { requireAuth } from "../middlewares/authMiddleware";
import { CreateDomainRequestSchema } from "../dto/domain.dto";
import { DomainController } from "../controllers/DomainController";
import { validateJson, validateArrayOfStringsJson } from "./bootstrap";
import { HonoEnv } from "../bindings";

const domainRoutes = new Hono<HonoEnv>();

domainRoutes.use("*", requireAuth);

domainRoutes.get("/", (c) => {
  const services = c.get("services");
  const controller = new DomainController(services.domainUseCase);
  return controller.getDomains(c);
});

domainRoutes.post("/", validateJson(CreateDomainRequestSchema), (c) => {
  const services = c.get("services");
  const controller = new DomainController(services.domainUseCase);
  return controller.createDomain(c);
});

domainRoutes.post("/import", validateArrayOfStringsJson(), (c) => {
  const services = c.get("services");
  const controller = new DomainController(services.domainUseCase);
  return controller.importDomains(c);
});

domainRoutes.delete("/:id", (c) => {
  const services = c.get("services");
  const controller = new DomainController(services.domainUseCase);
  return controller.deleteDomain(c);
});

export { domainRoutes };
