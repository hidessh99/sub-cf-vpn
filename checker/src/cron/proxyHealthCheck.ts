import { config } from '../utils/config';
import { IProxyRepository } from '../repositories/interfaces';
import { checkProxy } from '../utils/checkProxy';
import { logger } from '../utils/logger';
import { isPrivateIP } from '../utils/ipValidator';

export async function runHealthCheck(proxyRepo: IProxyRepository) {
  const cronConfig = config.cronCheck || {};
  const batchSize = cronConfig.batchSize || 20;
  const timeoutMs = cronConfig.timeoutMs || 3000;

  logger.info("Starting proxy health check cycle...", "CronCheck");
  
  try {
    const activeProxies = proxyRepo.findAllActive();
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
        
        if (isPrivateIP(host)) {
          logger.warn(`Cron check blocked private IP range proxy: ${host}:${port}. Marking as dead.`, "CronCheck");
          deadIds.push(p.id);
          return;
        }

        try {
          const res = await checkProxy(host, port, timeoutMs);
          if (!res.proxyip) {
            deadIds.push(p.id);
          }
        } catch (err) {
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
      logger.warn(`Found ${deadIds.length} dead proxies. Removing from SQLite database...`, "CronCheck");
      const deletedCount = proxyRepo.bulkDelete(deadIds);
      logger.info(`Successfully removed ${deletedCount} dead proxies.`, "CronCheck");
    } else {
      logger.info("All checked proxies are alive!", "CronCheck");
    }

    logger.info(`Health check cycle complete. ${checkedCount} checked, ${deadIds.length} deleted, ${checkedCount - deadIds.length} alive.`, "CronCheck");
  } catch (err: any) {
    logger.error("Error running health check cycle", err, "CronCheck");
  }
}

export function startProxyHealthCron(proxyRepo: IProxyRepository) {
  const cronConfig = config.cronCheck || {};
  const enabled = cronConfig.enabled !== false;
  const intervalHours = cronConfig.intervalHours || 24;
  
  if (!enabled) {
    logger.info("Cron check is disabled in config.", "CronCheck");
    return;
  }

  const intervalMs = intervalHours * 60 * 60 * 1000;
  logger.info(`Proxy health check scheduled every ${intervalHours} hours.`, "CronCheck");

  // Run initial check after 5 seconds delay so service starting outputs are complete
  setTimeout(() => {
    runHealthCheck(proxyRepo);
  }, 5000);

  // Set recurring interval
  setInterval(() => {
    runHealthCheck(proxyRepo);
  }, intervalMs);
}
