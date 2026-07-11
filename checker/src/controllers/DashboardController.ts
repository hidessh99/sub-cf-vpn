import { IProxyRepository, IDomainRepository, IBugRepository } from "../repositories/interfaces";
import { successResponse } from "../utils/response";
import { AuthContext } from "../middlewares/authMiddleware";
import { UnauthorizedError } from "../utils/errors";

export class DashboardController {
  constructor(
    private proxyRepo: IProxyRepository,
    private domainRepo: IDomainRepository,
    private bugRepo: IBugRepository
  ) {}

  async getStats(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) throw new UnauthorizedError("Unauthorized");

    const totalProxies = this.proxyRepo.count();
    const totalDomains = this.domainRepo.count();
    const totalBugs = this.bugRepo.count();

    return successResponse({
      proxies: totalProxies,
      domains: totalDomains,
      bugs: totalBugs,
    }, "Dashboard stats retrieved successfully");
  }
}
