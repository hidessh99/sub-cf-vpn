import { Database } from "bun:sqlite";
import { Admin } from "../models/Admin";
import { AdminRow } from "../entities/AdminEntity";
import { IAdminRepository } from "./interfaces";

export class AdminRepository implements IAdminRepository {
  constructor(private db: Database) {}

  findByUsername(username: string): Admin | null {
    const query = this.db.query("SELECT * FROM admins WHERE username = ? LIMIT 1");
    const result = query.get(username) as AdminRow | null;
    if (!result) return null;
    return {
      id: result.id,
      username: result.username,
      password: result.password,
      created_at: result.created_at,
      updated_at: result.updated_at
    };
  }

  findById(id: number): Admin | null {
    const query = this.db.query("SELECT * FROM admins WHERE id = ? LIMIT 1");
    const result = query.get(id) as AdminRow | null;
    if (!result) return null;
    return {
      id: result.id,
      username: result.username,
      password: result.password,
      created_at: result.created_at,
      updated_at: result.updated_at
    };
  }

  updatePassword(id: number, newHashedPassword: string): void {
    const query = this.db.query("UPDATE admins SET password = ?, updated_at = datetime('now') WHERE id = ?");
    query.run(newHashedPassword, id);
  }
}
