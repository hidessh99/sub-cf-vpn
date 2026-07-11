import { Context } from "hono";
import { IProxyRepository, IDomainRepository, IBugRepository } from "../repositories/interfaces";

export class DashboardController {
  constructor(
    private proxyRepo: IProxyRepository,
    private domainRepo: IDomainRepository,
    private bugRepo: IBugRepository
  ) {}

  async getStats(c: Context): Promise<Response> {
    const admin = c.get("admin");
    if (!admin) {
      return c.json({ success: false, message: "Unauthorized", error: null }, 401);
    }

    const totalProxies = this.proxyRepo.count();
    const totalDomains = this.domainRepo.count();
    const totalBugs = this.bugRepo.count();

    return c.json({
      success: true,
      message: "Dashboard stats retrieved successfully",
      data: {
        proxies: totalProxies,
        domains: totalDomains,
        bugs: totalBugs,
      }
    });
  }
}
