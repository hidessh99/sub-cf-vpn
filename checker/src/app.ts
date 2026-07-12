import { Hono } from "hono";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { timeout } from "hono/timeout";
import { HTTPException } from "hono/http-exception";
import { requestId } from "hono/request-id";
import { AppError } from "./utils/errors";
import { logger } from "./utils/logger";
import { HonoEnv } from "./middlewares/authMiddleware";
import { ZodError } from "zod";

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
app.use("*", requestId());
app.use("*", compress());
app.use("*", async (c, next) => {
  const reqId = c.get("requestId") || "";
  const method = c.req.method;
  const path = c.req.path;
  logger.info(`[ReqId: ${reqId}] --> ${method} ${path}`, "HTTP");
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  const status = c.res.status;
  logger.info(`[ReqId: ${reqId}] <-- ${method} ${path} ${status} - ${duration}ms`, "HTTP");
});

// Global Security Headers Middleware
app.use("*", async (c, next) => {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  if (process.env.NODE_ENV === "production") {
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  await next();
});

const customTimeoutException = new HTTPException(408, {
  message: "Request timeout. Please try again later.",
});
app.use("*", timeout(30000, customTimeoutException));

// Configure CORS origin list for admin routes from environment
const adminOrigins = process.env.ADMIN_ALLOWED_ORIGINS
  ? process.env.ADMIN_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"];

// Public CORS setup (Wildcard allowed)
app.use(
  "/api/v1/public/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    maxAge: 86400,
  })
);

app.use(
  "/api/check*",
  cors({
    origin: "*",
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    maxAge: 86400,
  })
);

app.use(
  "/health",
  cors({
    origin: "*",
    allowMethods: ["GET", "OPTIONS"],
    maxAge: 86400,
  })
);

// Admin CORS setup (Restricted Origins)
app.use(
  "/api/v1/*",
  cors({
    origin: (origin) => {
      if (!origin) return adminOrigins[0];
      return adminOrigins.includes(origin) ? origin : adminOrigins[0];
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
    credentials: true,
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
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => {
      const field = e.path.length > 0 ? e.path.join(".") : "input";
      return `${field}: ${e.message}`;
    });
    return c.json(
      {
        success: false,
        message: "Validation failed",
        errors,
        error: null,
      },
      400
    );
  }

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
