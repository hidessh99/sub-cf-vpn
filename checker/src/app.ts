import { Hono } from "hono";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { logger as honoLogger } from "hono/logger";
import { timeout } from "hono/timeout";
import { HTTPException } from "hono/http-exception";
import { AppError } from "./utils/errors";
import { logger } from "./utils/logger";
import { HonoEnv } from "./middlewares/authMiddleware";

// Import Hono routers
import { auth } from "./routes/auth.routes";
import { proxyAdminRoutes } from "./routes/proxy.routes";
import { publicRoutes } from "./routes/public.routes";
import { checkerRoutes } from "./routes/checker.routes";
import { domainRoutes } from "./routes/domain.routes";
import { bugRoutes } from "./routes/bug.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { systemRoutes } from "./routes/system.routes";

const app = new Hono<HonoEnv>();

// Register global middlewares
app.use("*", compress());
app.use("*", honoLogger((message: string) => {
  logger.info(message, "HTTP");
}));

const customTimeoutException = new HTTPException(408, {
  message: "Request timeout. Please try again later.",
});
app.use("*", timeout(30000, customTimeoutException));

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

// Mount routes
app.route("/", systemRoutes);
app.route("/api/v1/auth", auth);
app.route("/api/v1/proxies", proxyAdminRoutes);
app.route("/api/v1/public", publicRoutes);
app.route("/api/v1/domains", domainRoutes);
app.route("/api/v1/bugs", bugRoutes);
app.route("/api/v1/dashboard", dashboardRoutes);
app.route("/api", checkerRoutes);

// Global Error Handler
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        message: err.message,
        error: null,
      },
      err.statusCode as any
    );
  }

  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        message: err.message,
        error: null,
      },
      err.status as any
    );
  }

  logger.error("Unexpected error occurred during routing", err, "Router");
  return c.json(
    {
      success: false,
      message: err.message || "Internal Server Error",
      error: null,
    },
    500
  );
});

// Custom 404 Handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: `Route not found: ${c.req.method} ${c.req.path}`,
      error: null,
    },
    404
  );
});

export { app };
