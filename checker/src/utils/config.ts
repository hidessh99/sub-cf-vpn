import { join } from "node:path";
import { existsSync, readFileSync } from "node:fs";

export interface AppConfig {
  port: number;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  admin: {
    username: string;
    password?: string;
  };
  cronCheck?: {
    enabled?: boolean;
    intervalHours?: number;
    batchSize?: number;
    timeoutMs?: number;
  };
}

const configPath = join(import.meta.dir, "..", "..", "config.json");
let fileConfig: Partial<AppConfig> = {};

try {
  if (existsSync(configPath)) {
    const rawData = readFileSync(configPath, "utf-8");
    fileConfig = JSON.parse(rawData);
  }
} catch (e) {
  console.warn("⚠️ Failed to load config.json, falling back to environment variables.");
}

// Generate a random secret for development fallback
const randomSecret = require("node:crypto").randomBytes(32).toString("hex");

const isProd = process.env.NODE_ENV === "production";

// Prioritize environment variables over config.json
const jwtSecret = process.env.JWT_SECRET || fileConfig.jwt?.secret;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || fileConfig.jwt?.expiresIn || "24h";
const adminUsername = process.env.ADMIN_USERNAME || fileConfig.admin?.username || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || fileConfig.admin?.password;
const port = parseInt(process.env.PORT || String(fileConfig.port || "4002"), 10);

// Validate JWT Secret in production
if (isProd && !jwtSecret) {
  throw new Error("❌ CRITICAL: JWT_SECRET environment variable or config.json value must be set in production mode!");
}

// Validate Admin Password
if (isProd && !adminPassword) {
  throw new Error("❌ CRITICAL: Admin password must be set via ADMIN_PASSWORD environment variable or config.json in production mode!");
}

const config: AppConfig = {
  port,
  jwt: {
    secret: jwtSecret || randomSecret,
    expiresIn: jwtExpiresIn,
  },
  admin: {
    username: adminUsername,
    password: adminPassword || "dev-only-insecure-password", // fallback is only for non-production development convenience
  },
  cronCheck: {
    enabled: process.env.CRON_ENABLED === "true" || fileConfig.cronCheck?.enabled || false,
    intervalHours: parseInt(process.env.CRON_INTERVAL_HOURS || String(fileConfig.cronCheck?.intervalHours || "24"), 10),
    batchSize: parseInt(process.env.CRON_BATCH_SIZE || String(fileConfig.cronCheck?.batchSize || "20"), 10),
    timeoutMs: parseInt(process.env.CRON_TIMEOUT_MS || String(fileConfig.cronCheck?.timeoutMs || "3000"), 10),
  }
};

export { config };

