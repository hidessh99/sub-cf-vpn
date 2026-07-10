import { ProxyRepository } from "../repositories/ProxyRepository";
import { DomainRepository } from "../repositories/DomainRepository";
import { BugRepository } from "../repositories/BugRepository";
import { successResponse, errorResponse } from "../utils/response";
import { AuthContext } from "../middlewares/authMiddleware";

export class DashboardController {
  private proxyRepo = new ProxyRepository();
  private domainRepo = new DomainRepository();
  private bugRepo = new BugRepository();

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
