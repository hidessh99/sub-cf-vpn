import { config } from '../utils/config';
import { ProxyRepository } from '../repositories/ProxyRepository';
import { checkProxy } from '../utils/checkProxy';

const proxyRepo = new ProxyRepository();

export async function runHealthCheck() {
  const cronConfig = config.cronCheck || {};
  const batchSize = cronConfig.batchSize || 20;
  const timeoutMs = cronConfig.timeoutMs || 3000;

  console.log(`🔄 [CronCheck] Starting proxy health check cycle...`);
  
  try {
    const activeProxies = proxyRepo.findAllActive();
    if (activeProxies.length === 0) {
      console.log(`🔄 [CronCheck] No active proxies found in database. Cycle finished.`);
      return;
    }

    console.log(`🔄 [CronCheck] Found ${activeProxies.length} active proxies to check.`);
    const deadIds: number[] = [];
    let checkedCount = 0;

    // Process in batches
    for (let i = 0; i < activeProxies.length; i += batchSize) {
      const batch = activeProxies.slice(i, i + batchSize);
      const promises = batch.map(async (p) => {
        const host = p.proxy || p.ip;
        const port = parseInt(p.port || '443', 10);
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
        console.log(`   [Progress] Checked ${checkedCount}/${activeProxies.length} proxies...`);
      }
    }

    if (deadIds.length > 0) {
      console.log(`⚠️ [CronCheck] Found ${deadIds.length} dead proxies. Removing from SQLite database...`);
      const deletedCount = proxyRepo.bulkDelete(deadIds);
      console.log(`✅ [CronCheck] Successfully removed ${deletedCount} dead proxies.`);
    } else {
      console.log(`✅ [CronCheck] All checked proxies are alive!`);
    }

    console.log(`🔄 [CronCheck] Health check cycle complete. ${checkedCount} checked, ${deadIds.length} deleted, ${checkedCount - deadIds.length} alive.`);
  } catch (err: any) {
    console.error(`❌ [CronCheck] Error running health check cycle:`, err);
  }
}

export function startProxyHealthCron() {
  const cronConfig = config.cronCheck || {};
  const enabled = cronConfig.enabled !== false;
  const intervalHours = cronConfig.intervalHours || 24;
  
  if (!enabled) {
    console.log(`⚙️  [CronCheck] Cron check is disabled in config.`);
    return;
  }

  const intervalMs = intervalHours * 60 * 60 * 1000;
  console.log(`⚙️  [CronCheck] Proxy health check scheduled every ${intervalHours} hours.`);

  // Run initial check after 5 seconds delay so service starting outputs are complete
  setTimeout(() => {
    runHealthCheck();
  }, 5000);

  // Set recurring interval
  setInterval(() => {
    runHealthCheck();
  }, intervalMs);
}
