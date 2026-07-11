import { IProxyRepository, IDomainRepository, IBugRepository } from "../repositories/interfaces";
import { successResponse, errorResponse } from "../utils/response";
import { AuthContext } from "../middlewares/authMiddleware";

export class DashboardController {
  constructor(
    private proxyRepo: IProxyRepository,
    private domainRepo: IDomainRepository,
    private bugRepo: IBugRepository
  ) {}

  async getStats(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) return errorResponse("Unauthorized", 401);

    try {
      const totalProxies = this.proxyRepo.count();
      const totalDomains = this.domainRepo.count();
      const totalBugs = this.bugRepo.count();

      return successResponse({
        proxies: totalProxies,
        domains: totalDomains,
        bugs: totalBugs,
      }, "Dashboard stats retrieved successfully");
    } catch (e: any) {
      return errorResponse(e.message || "Failed to retrieve stats", 400);
    }
  }
}
