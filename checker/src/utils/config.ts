import { join } from "node:path";

export interface AppConfig {
  port: number;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  admin: {
    username: string;
    password: string;
  };
  cronCheck?: {
    enabled?: boolean;
    intervalHours?: number;
    batchSize?: number;
    timeoutMs?: number;
  };
}

const configPath = join(import.meta.dir, "..", "..", "config.json");
const file = Bun.file(configPath);

let config: AppConfig;

try {
  if (await file.exists()) {
    config = await file.json() as AppConfig;
  } else {
    throw new Error("File not found");
  }
} catch (e) {
  console.warn("⚠️ Failed to load config.json, using environment variables or defaults.");
  const randomSecret = require("node:crypto").randomBytes(32).toString("hex");
  config = {
    port: parseInt(process.env.PORT || "4002", 10),
    jwt: {
      secret: process.env.JWT_SECRET || randomSecret,
      expiresIn: process.env.JWT_EXPIRES_IN || "24h"
    },
    admin: {
      username: process.env.ADMIN_USERNAME || "admin",
      password: process.env.ADMIN_PASSWORD || "admin123"
    },
    cronCheck: {
      enabled: false,
      intervalHours: 24,
      batchSize: 20,
      timeoutMs: 3000
    }
  };
}

// Security: Prevent using default or placeholder JWT secrets
if (
  !config.jwt.secret ||
  config.jwt.secret === "YOUR_JWT_SECRET_KEY_MIN_32_CHARS" ||
  config.jwt.secret === "super-secret-key-change-this-in-production-12345678"
) {
  console.warn("🛡️ Security Warning: Default JWT secret detected. Generating a secure temporary secret for this session.");
  config.jwt.secret = require("node:crypto").randomBytes(32).toString("hex");
}

// Security: Warn on default admin credentials
if (
  config.admin.username === "admin" &&
  (config.admin.password === "admin123" || config.admin.password === "CHANGE_THIS_PASSWORD")
) {
  console.warn("🛡️ CRITICAL Security Warning: Default admin credentials detected. Please change them immediately to secure your deployment.");
}

export { config };
