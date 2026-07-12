import { createServices } from "./routes/bootstrap";

export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  CRON_BATCH_SIZE: string;
  CRON_TIMEOUT_MS: string;
};

export type HonoEnv = {
  Bindings: Bindings;
  Variables: {
    admin: { id: number; username: string } | null;
    services: ReturnType<typeof createServices>;
  };
};
