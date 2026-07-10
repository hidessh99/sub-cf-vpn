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
  config = {
    port: parseInt(process.env.PORT || "4002", 10),
    jwt: {
      secret: process.env.JWT_SECRET || "super-secret-key-change-this-in-production-12345678",
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

export { config };
