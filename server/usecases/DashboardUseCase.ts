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

  async getStats(): Promise<DashboardStats> {
    logger.debug("Retrieving dashboard stats", "DashboardUseCase");
    const totalProxies = await this.proxyRepo.count();
    const totalDomains = await this.domainRepo.count();
    const totalBugs = await this.bugRepo.count();

    return {
      proxies: totalProxies,
      domains: totalDomains,
      bugs: totalBugs,
    };
  }
}
