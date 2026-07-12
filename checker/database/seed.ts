import { db, initDatabase } from "./database";
import { join } from "node:path";
import { config } from "../src/utils/config";
import { logger } from "../src/utils/logger";

export async function seed() {
  // Ensure tables exist
  initDatabase();

  // 1. Seed Admin
  const adminCountResult = db.query("SELECT COUNT(*) as count FROM admins").get() as { count: number };
  if (adminCountResult.count === 0) {
    const username = config.admin.username;
    const passwordPlain = config.admin.password;
    const passwordHash = await Bun.password.hash(passwordPlain, {
      algorithm: "argon2id",
      memoryCost: 65536,
      timeCost: 2,
    });

    db.query("INSERT INTO admins (username, password) VALUES (?, ?)").run(username, passwordHash);
    logger.info("Created default admin user.", "Seed");
  }

  // 2. Import existing public/proxyip.json
  const proxyCountResult = db.query("SELECT COUNT(*) as count FROM proxies").get() as { count: number };
  if (proxyCountResult.count === 0) {
    const path = join(import.meta.dir, "..", "..", "public", "proxyip.json");
    try {
      const file = Bun.file(path);
      if (await file.exists()) {
        const data = await file.json();
        logger.info(`Importing ${data.length} proxies from public/proxyip.json...`, "Seed");
        
        const insertProxy = db.prepare(`
          INSERT INTO proxies (
            proxy, port, proxyip, ip, latency, asn, as_organization, 
            colo, country, city, region, postal_code, latitude, longitude, is_active
          ) VALUES (
            $proxy, $port, $proxyip, $ip, $latency, $asn, $as_organization,
            $colo, $country, $city, $region, $postal_code, $latitude, $longitude, 1
          )
        `);

        // Run as transaction for speed
        const transaction = db.transaction((proxies) => {
          for (const p of proxies) {
            insertProxy.run({
              $proxy: String(p.proxy || p.ip),
              $port: String(p.port || "443"),
              $proxyip: p.proxyip ? 1 : 0,
              $ip: String(p.ip),
              $latency: Number(p.latency || 0),
              $asn: p.asn ? Number(p.asn) : null,
              $as_organization: p.asOrganization ? String(p.asOrganization) : null,
              $colo: p.colo ? String(p.colo) : null,
              $country: p.country ? String(p.country) : null,
              $city: p.city ? String(p.city) : null,
              $region: p.region ? String(p.region) : null,
              $postal_code: p.postalCode ? String(p.postalCode) : null,
              $latitude: p.latitude ? String(p.latitude) : null,
              $longitude: p.longitude ? String(p.longitude) : null
            });
          }
        });

        transaction(data);
        logger.info("Successfully imported proxies.", "Seed");
      }
    } catch (e) {
      logger.error("Error seeding proxies", e, "Seed");
    }
  }

  // 3. Import existing public/domain.json
  const domainCountResult = db.query("SELECT COUNT(*) as count FROM domains").get() as { count: number };
  if (domainCountResult.count === 0) {
    const path = join(import.meta.dir, "..", "..", "public", "domain.json");
    try {
      const file = Bun.file(path);
      if (await file.exists()) {
        const data = await file.json();
        logger.info(`Importing ${data.length} domains from public/domain.json...`, "Seed");
        
        const insertDomain = db.prepare(`
          INSERT INTO domains (domain, is_active) VALUES (?, 1)
        `);

        const transaction = db.transaction((domains) => {
          for (const d of domains) {
            insertDomain.run(String(d));
          }
        });

        transaction(data);
        logger.info("Successfully imported domains.", "Seed");
      }
    } catch (e) {
      logger.error("Error seeding domains", e, "Seed");
    }
  }

  // 4. Import existing public/bug_list.json
  const bugCountResult = db.query("SELECT COUNT(*) as count FROM bugs").get() as { count: number };
  if (bugCountResult.count === 0) {
    const path = join(import.meta.dir, "..", "..", "public", "bug_list.json");
    try {
      const file = Bun.file(path);
      if (await file.exists()) {
        const data = await file.json();
        logger.info(`Importing ${data.length} bugs from public/bug_list.json...`, "Seed");
        
        const insertBug = db.prepare(`
          INSERT INTO bugs (hostname, is_active) VALUES (?, 1)
        `);

        const transaction = db.transaction((bugs) => {
          for (const b of bugs) {
            insertBug.run(String(b));
          }
        });

        transaction(data);
        logger.info("Successfully imported bugs.", "Seed");
      }
    } catch (e) {
      logger.error("Error seeding bugs", e, "Seed");
    }
  }
}

// Allow direct execution
if (import.meta.main) {
  seed();
}
