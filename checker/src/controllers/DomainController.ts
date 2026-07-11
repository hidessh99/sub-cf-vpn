import { DomainUseCase } from "../usecases/DomainUseCase";
import { successResponse, errorResponse, jsonResponse } from "../utils/response";
import { AuthContext } from "../middlewares/authMiddleware";
import { CreateDomainRequest } from "../dto/domain.dto";

export class DomainController {
  constructor(private domainUseCase: DomainUseCase) {}

  async getDomains(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) return errorResponse("Unauthorized", 401);

    try {
      const list = this.domainUseCase.getAllDomains();
      return successResponse(list, "Domains retrieved successfully");
    } catch (e: any) {
      return errorResponse(e.message || "Failed to fetch domains", 400);
    }
  }

  async createDomain(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) return errorResponse("Unauthorized", 401);

    try {
      const body = await request.json() as CreateDomainRequest;
      const { domain } = body;
      
      if (!domain) {
        return errorResponse("Domain field is required", 400);
      }

      const result = this.domainUseCase.createDomain(domain);
      return successResponse(result, "Domain created successfully", 201);
    } catch (e: any) {
      return errorResponse(e.message || "Failed to create domain", 400);
    }
  }

  async deleteDomain(id: number, admin: AuthContext | null): Promise<Response> {
    if (!admin) return errorResponse("Unauthorized", 401);

    try {
      this.domainUseCase.deleteDomain(id);
      return successResponse(null, "Domain deleted successfully");
    } catch (e: any) {
      return errorResponse(e.message || "Failed to delete domain", 400);
    }
  }

  async getPublicDomains(): Promise<Response> {
    try {
      const list = this.domainUseCase.getPublicDomainList();
      // Return raw array of strings to match static domain.json
      return jsonResponse(list);
    } catch (e: any) {
      return errorResponse("Failed to fetch public domains", 500);
    }
  }

  async importDomains(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) return errorResponse("Unauthorized", 401);

    try {
      const body = await request.json();
      const list = (Array.isArray(body) ? body : [body]) as string[];
      const count = this.domainUseCase.importFromJSON(list);
      return successResponse({ imported: count }, `Successfully imported ${count} domains`);
    } catch (e: any) {
      return errorResponse(e.message || "Failed to import domains", 400);
    }
  }
}
