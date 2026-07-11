import { DomainUseCase } from "../usecases/DomainUseCase";
import { successResponse, jsonResponse } from "../utils/response";
import { AuthContext } from "../middlewares/authMiddleware";
import { CreateDomainRequestSchema } from "../dto/domain.dto";
import { ValidationError, UnauthorizedError } from "../utils/errors";
import { z } from "zod";

export class DomainController {
  constructor(private domainUseCase: DomainUseCase) {}

  async getDomains(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) throw new UnauthorizedError("Unauthorized");
    const list = this.domainUseCase.getAllDomains();
    return successResponse(list, "Domains retrieved successfully");
  }

  async createDomain(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) throw new UnauthorizedError("Unauthorized");

    const body = await request.json().catch(() => ({}));
    const parsed = CreateDomainRequestSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map(e => e.message).join(", ");
      throw new ValidationError(msg);
    }

    const { domain } = parsed.data;
    const result = this.domainUseCase.createDomain(domain);
    return successResponse(result, "Domain created successfully", 201);
  }

  async deleteDomain(id: number, admin: AuthContext | null): Promise<Response> {
    if (!admin) throw new UnauthorizedError("Unauthorized");
    this.domainUseCase.deleteDomain(id);
    return successResponse(null, "Domain deleted successfully");
  }

  async getPublicDomains(): Promise<Response> {
    const list = this.domainUseCase.getPublicDomainList();
    return jsonResponse(list);
  }

  async importDomains(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) throw new UnauthorizedError("Unauthorized");

    const body = await request.json().catch(() => []);
    const parsed = z.array(z.string().min(1)).safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Import data must be a JSON array of non-empty strings");
    }

    const count = this.domainUseCase.importFromJSON(parsed.data);
    return successResponse({ imported: count }, `Successfully imported ${count} domains`);
  }
}
