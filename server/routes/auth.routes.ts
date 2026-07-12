import { Hono } from "hono";
import { requireAuth } from "../middlewares/authMiddleware";
import { LoginRequestSchema, ChangePasswordRequestSchema } from "../dto/auth.dto";
import { AuthController } from "../controllers/AuthController";
import { validateJson } from "./bootstrap";
import { HonoEnv } from "../bindings";

const auth = new Hono<HonoEnv>();

auth.post("/login", validateJson(LoginRequestSchema), (c) => {
  const services = c.get("services");
  const controller = new AuthController(services.authUseCase);
  return controller.login(c);
});

auth.get("/me", requireAuth, (c) => {
  const services = c.get("services");
  const controller = new AuthController(services.authUseCase);
  return controller.getProfile(c);
});

auth.put("/password", requireAuth, validateJson(ChangePasswordRequestSchema), (c) => {
  const services = c.get("services");
  const controller = new AuthController(services.authUseCase);
  return controller.changePassword(c);
});

export { auth };
