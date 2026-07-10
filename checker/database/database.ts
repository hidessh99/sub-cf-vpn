import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const DB_DIR = join(import.meta.dir, "..", "data");
const DB_PATH = join(DB_DIR, "admin.db");

// Ensure directory exists
try {
  mkdirSync(DB_DIR, { recursive: true });
} catch (e) {
  // Ignore if exists
}

export const db = new Database(DB_PATH, { create: true });

// Enable WAL mode for better write performance
db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA foreign_keys = ON;");

// Initialize Schema
export function initDatabase() {
  // admins table
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // proxies table
  db.run(`
    CREATE TABLE IF NOT EXISTS proxies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proxy TEXT NOT NULL,
      port TEXT DEFAULT '443',
      proxyip INTEGER DEFAULT 1,
      ip TEXT NOT NULL,
      latency INTEGER DEFAULT 0,
      asn INTEGER,
      as_organization TEXT,
      colo TEXT,
      country TEXT,
      city TEXT,
      region TEXT,
      postal_code TEXT,
      latitude TEXT,
      longitude TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // domains table
  db.run(`
    CREATE TABLE IF NOT EXISTS domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // bugs table
  db.run(`
    CREATE TABLE IF NOT EXISTS bugs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hostname TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log("📁 [Database] SQLite initialized successfully.");
}
