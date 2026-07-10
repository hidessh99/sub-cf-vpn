import { db } from "../../database/database";
import { Bug } from "../models/Bug";
import { BugRow } from "../entities/BugEntity";
import { CountRow, IdRow } from "../entities/CommonEntity";

export class BugRepository {
  findAll(): Bug[] {
    const rows = db.query("SELECT * FROM bugs ORDER BY id DESC").all() as BugRow[];
    return rows.map((r) => ({
      id: r.id,
      hostname: r.hostname,
      is_active: r.is_active === 1,
      created_at: r.created_at,
    }));
  }

  findByHostname(hostname: string): Bug | null {
    const row = db.query("SELECT * FROM bugs WHERE hostname = ? LIMIT 1").get(hostname) as BugRow | null;
    if (!row) return null;
    return {
      id: row.id,
      hostname: row.hostname,
      is_active: row.is_active === 1,
      created_at: row.created_at,
    };
  }

  create(hostname: string): Bug {
    const result = db.prepare("INSERT INTO bugs (hostname, is_active) VALUES (?, 1) RETURNING id").get(hostname) as IdRow;
    const row = db.query("SELECT * FROM bugs WHERE id = ?").get(result.id) as BugRow;
    return {
      id: row.id,
      hostname: row.hostname,
      is_active: row.is_active === 1,
      created_at: row.created_at,
    };
  }

  delete(id: number): void {
    db.query("DELETE FROM bugs WHERE id = ?").run(id);
  }

  getPublicList(): string[] {
    const rows = db.query("SELECT hostname FROM bugs WHERE is_active = 1").all() as { hostname: string }[];
    return rows.map((r) => r.hostname);
  }

  count(): number {
    const result = db.query("SELECT COUNT(*) as count FROM bugs").get() as CountRow;
    return result.count;
  }
}
