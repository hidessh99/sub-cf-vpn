import { Admin } from "../models/Admin";
import { AdminRow } from "../entities/AdminEntity";
import { IAdminRepository } from "./interfaces";

export class AdminRepository implements IAdminRepository {
  constructor(private db: D1Database) {}

  async findByUsername(username: string): Promise<Admin | null> {
    const result = await this.db.prepare("SELECT * FROM admins WHERE username = ? LIMIT 1")
      .bind(username)
      .first<AdminRow>();
    if (!result) return null;
    return {
      id: result.id,
      username: result.username,
      password: result.password,
      created_at: result.created_at,
      updated_at: result.updated_at
    };
  }

  async findById(id: number): Promise<Admin | null> {
    const result = await this.db.prepare("SELECT * FROM admins WHERE id = ? LIMIT 1")
      .bind(id)
      .first<AdminRow>();
    if (!result) return null;
    return {
      id: result.id,
      username: result.username,
      password: result.password,
      created_at: result.created_at,
      updated_at: result.updated_at
    };
  }

  async updatePassword(id: number, newHashedPassword: string): Promise<void> {
    await this.db.prepare("UPDATE admins SET password = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(newHashedPassword, id)
      .run();
  }
}
