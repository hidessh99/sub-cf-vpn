import { Hono } from "hono";
import { HonoEnv, requireAuth } from "../middlewares/authMiddleware";
import { LoginRequestSchema, ChangePasswordRequestSchema } from "../dto/auth.dto";
import { authController, validateJson } from "./bootstrap";

const auth = new Hono<HonoEnv>();

auth.post("/login", validateJson(LoginRequestSchema), (c) => authController.login(c));
auth.get("/me", requireAuth, (c) => authController.getProfile(c));
auth.put("/password", requireAuth, validateJson(ChangePasswordRequestSchema), (c) => authController.changePassword(c));

export { auth };
