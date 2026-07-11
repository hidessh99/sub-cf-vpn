import { IProxyRepository, IDomainRepository, IBugRepository } from "../repositories/interfaces";
import { logger } from "../utils/logger";

export interface DashboardStats {
  proxies: number;
  domains: number;
  bugs: number;
}

export class DashboardUseCase {
  constructor(
    private proxyRepo: IProxyRepository,
    private domainRepo: IDomainRepository,
    private bugRepo: IBugRepository
  ) {}

  getStats(): DashboardStats {
    logger.debug("Retrieving dashboard stats", "DashboardUseCase");
    const totalProxies = this.proxyRepo.count();
    const totalDomains = this.domainRepo.count();
    const totalBugs = this.bugRepo.count();

    return {
      proxies: totalProxies,
      domains: totalDomains,
      bugs: totalBugs,
    };
  }
}
