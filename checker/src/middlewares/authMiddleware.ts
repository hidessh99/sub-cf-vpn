import { createMiddleware } from "hono/factory";
import { verifyToken } from "../utils/jwt";

export interface AuthContext {
  id: number;
  username: string;
}

export type HonoEnv = {
  Variables: {
    admin: AuthContext | null;
  }
}

export async function authenticateRequest(request: Request): Promise<AuthContext | null> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);
    if (!decoded.id || !decoded.username) {
      return null;
    }
    return {
      id: Number(decoded.id),
      username: String(decoded.username),
    };
  } catch (e) {
    return null;
  }
}

export const optionalAuth = createMiddleware<HonoEnv>(async (c, next) => {
  const admin = await authenticateRequest(c.req.raw);
  c.set("admin", admin);
  await next();
});

export const requireAuth = createMiddleware<HonoEnv>(async (c, next) => {
  const admin = await authenticateRequest(c.req.raw);
  if (!admin) {
    return c.json({ success: false, message: "Unauthorized", error: null }, 401);
  }
  c.set("admin", admin);
  await next();
});
