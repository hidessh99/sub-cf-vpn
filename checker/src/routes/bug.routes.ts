import { Hono } from "hono";
import { HonoEnv, requireAuth } from "../middlewares/authMiddleware";
import { CreateBugRequestSchema } from "../dto/bug.dto";
import { bugController, validateJson, validateArrayOfStringsJson } from "./bootstrap";

const bugRoutes = new Hono<HonoEnv>();

bugRoutes.use("*", requireAuth);

bugRoutes.get("/", (c) => bugController.getBugs(c));
bugRoutes.post("/", validateJson(CreateBugRequestSchema), (c) => bugController.createBug(c));
bugRoutes.post("/import", validateArrayOfStringsJson(), (c) => bugController.importBugs(c));
bugRoutes.delete("/:id", (c) => bugController.deleteBug(c));

export { bugRoutes };
