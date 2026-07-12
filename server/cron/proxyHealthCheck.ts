import { ProxyRepository } from '../repositories/ProxyRepository';
import { logger } from '../utils/logger';
import { connect } from 'cloudflare:sockets';
import { Bindings } from '../bindings';

async function checkEdgeSocket(ip: string, port: number, timeoutMs = 2500): Promise<boolean> {
  try {
    const socket = connect(`${ip}:${port}`);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), timeoutMs);
    });
    await Promise.race([socket.opened, timeoutPromise]);
    await socket.close();
    return true;
  } catch (err) {
    return false;
  }
}

export async function runHealthCheck(db: D1Database, env: Bindings) {
  const batchSize = parseInt(env.CRON_BATCH_SIZE || "10", 10);
  const timeoutMs = parseInt(env.CRON_TIMEOUT_MS || "2500", 10);

  logger.info("Starting proxy health check cycle...", "CronCheck");
  const proxyRepo = new ProxyRepository(db);

  try {
    const activeProxies = await proxyRepo.findAllActive();
    if (activeProxies.length === 0) {
      logger.info("No active proxies found in database. Cycle finished.", "CronCheck");
      return;
    }

    logger.info(`Found ${activeProxies.length} active proxies to check.`, "CronCheck");
    const deadIds: number[] = [];
    let checkedCount = 0;

    // Process in batches
    for (let i = 0; i < activeProxies.length; i += batchSize) {
      const batch = activeProxies.slice(i, i + batchSize);
      const promises = batch.map(async (p) => {
        const host = p.proxy || p.ip;
        const port = parseInt(p.port || '443', 10);
        const alive = await checkEdgeSocket(host, port, timeoutMs);
        if (!alive) {
          deadIds.push(p.id);
        }
      });
      
      await Promise.all(promises);
      checkedCount += batch.length;
      if (activeProxies.length > 50) {
        logger.info(`Checked ${checkedCount}/${activeProxies.length} proxies...`, "CronCheck");
      }
    }

    if (deadIds.length > 0) {
      logger.warn(`Found ${deadIds.length} dead proxies. Removing from D1 database...`, "CronCheck");
      const deletedCount = await proxyRepo.bulkDelete(deadIds);
      logger.info(`Successfully removed ${deletedCount} dead proxies.`, "CronCheck");
    } else {
      logger.info("All checked proxies are alive!", "CronCheck");
    }

    logger.info(`Health check cycle complete. ${checkedCount} checked, ${deadIds.length} deleted, ${checkedCount - deadIds.length} alive.`, "CronCheck");
  } catch (err: any) {
    logger.error("Error running health check cycle", err, "CronCheck");
  }
}
