import { db, initDatabase } from "./database";
import { join } from "node:path";

export async function seed() {
  // Ensure tables exist
  initDatabase();

  // 1. Seed Admin
  const adminCountResult = db.query("SELECT COUNT(*) as count FROM admins").get() as { count: number };
  if (adminCountResult.count === 0) {
    const username = process.env.ADMIN_USERNAME || "admin";
    const passwordPlain = process.env.ADMIN_PASSWORD || "admin123";
    const passwordHash = await Bun.password.hash(passwordPlain, {
      algorithm: "argon2id",
      memoryCost: 65536,
      timeCost: 2,
    });

    db.query("INSERT INTO admins (username, password) VALUES (?, ?)").run(username, passwordHash);
    console.log(`👤 [Seed] Created default admin user: '${username}'`);
  }

  // 2. Import existing public/proxyip.json
  const proxyCountResult = db.query("SELECT COUNT(*) as count FROM proxies").get() as { count: number };
  if (proxyCountResult.count === 0) {
    const path = join(import.meta.dir, "..", "..", "public", "proxyip.json");
    try {
      const file = Bun.file(path);
      if (await file.exists()) {
        const data = await file.json();
        console.log(`📦 [Seed] Importing ${data.length} proxies from public/proxyip.json...`);
        
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
        console.log(`✅ [Seed] Successfully imported proxies.`);
      }
    } catch (e) {
      console.error("❌ [Seed] Error seeding proxies:", e);
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
        console.log(`📦 [Seed] Importing ${data.length} domains from public/domain.json...`);
        
        const insertDomain = db.prepare(`
          INSERT INTO domains (domain, is_active) VALUES (?, 1)
        `);

        const transaction = db.transaction((domains) => {
          for (const d of domains) {
            insertDomain.run(String(d));
          }
        });

        transaction(data);
        console.log(`✅ [Seed] Successfully imported domains.`);
      }
    } catch (e) {
      console.error("❌ [Seed] Error seeding domains:", e);
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
        console.log(`📦 [Seed] Importing ${data.length} bugs from public/bug_list.json...`);
        
        const insertBug = db.prepare(`
          INSERT INTO bugs (hostname, is_active) VALUES (?, 1)
        `);

        const transaction = db.transaction((bugs) => {
          for (const b of bugs) {
            insertBug.run(String(b));
          }
        });

        transaction(data);
        console.log(`✅ [Seed] Successfully imported bugs.`);
      }
    } catch (e) {
      console.error("❌ [Seed] Error seeding bugs:", e);
    }
  }
}

// Allow direct execution
if (import.meta.main) {
  seed();
}
