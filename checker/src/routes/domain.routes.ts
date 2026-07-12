import { Hono } from "hono";
import { HonoEnv, requireAuth } from "../middlewares/authMiddleware";
import { CreateDomainRequestSchema } from "../dto/domain.dto";
import { domainController, validateJson, validateArrayOfStringsJson } from "./bootstrap";

const domainRoutes = new Hono<HonoEnv>();

domainRoutes.use("*", requireAuth);

domainRoutes.get("/", (c) => domainController.getDomains(c));
domainRoutes.post("/", validateJson(CreateDomainRequestSchema), (c) => domainController.createDomain(c));
domainRoutes.post("/import", validateArrayOfStringsJson(), (c) => domainController.importDomains(c));
domainRoutes.delete("/:id", (c) => domainController.deleteDomain(c));

export { domainRoutes };
