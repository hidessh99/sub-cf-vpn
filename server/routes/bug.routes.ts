import { Hono } from "hono";
import { requireAuth } from "../middlewares/authMiddleware";
import { CreateBugRequestSchema } from "../dto/bug.dto";
import { BugController } from "../controllers/BugController";
import { validateJson, validateArrayOfStringsJson } from "./bootstrap";
import { HonoEnv } from "../bindings";

const bugRoutes = new Hono<HonoEnv>();

bugRoutes.use("*", requireAuth);

bugRoutes.get("/", (c) => {
  const services = c.get("services");
  const controller = new BugController(services.bugUseCase);
  return controller.getBugs(c);
});

bugRoutes.post("/", validateJson(CreateBugRequestSchema), (c) => {
  const services = c.get("services");
  const controller = new BugController(services.bugUseCase);
  return controller.createBug(c);
});

bugRoutes.post("/import", validateArrayOfStringsJson(), (c) => {
  const services = c.get("services");
  const controller = new BugController(services.bugUseCase);
  return controller.importBugs(c);
});

bugRoutes.delete("/:id", (c) => {
  const services = c.get("services");
  const controller = new BugController(services.bugUseCase);
  return controller.deleteBug(c);
});

export { bugRoutes };
