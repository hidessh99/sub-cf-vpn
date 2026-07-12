import { hashPassword } from "./password";
import { logger } from "./logger";

export async function ensureAdminSeeded(db: D1Database, username: string, password: string) {
  try {
    const admin = await db.prepare("SELECT id FROM admins WHERE username = ?")
      .bind(username)
      .first();
    if (!admin) {
      const hash = await hashPassword(password);
      await db.prepare("INSERT INTO admins (username, password) VALUES (?, ?)")
        .bind(username, hash)
        .run();
      logger.info(`Created default admin user '${username}'.`, "Seed");
    }
  } catch (err) {
    logger.error("Failed to seed admin database", err, "Seed");
  }
}
