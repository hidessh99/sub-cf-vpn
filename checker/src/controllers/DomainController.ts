import { Context } from "hono";
import { DomainUseCase } from "../usecases/DomainUseCase";
import { CreateDomainRequest } from "../dto/domain.dto";
import { logger } from "../utils/logger";

export class DomainController {
  constructor(private domainUseCase: DomainUseCase) {}

  async getDomains(c: Context): Promise<Response> {
    const list = this.domainUseCase.getAllDomains();
    return c.json({
      success: true,
      message: "Domains retrieved successfully",
      data: list
    });
  }

  async createDomain(c: Context): Promise<Response> {
    const { domain } = (c.req.valid as any)("json") as CreateDomainRequest;
    const result = this.domainUseCase.createDomain(domain);
    return c.json({
      success: true,
      message: "Domain created successfully",
      data: result
    }, 201);
  }

  async deleteDomain(c: Context): Promise<Response> {
    const id = parseInt(c.req.param("id"), 10);
    if (isNaN(id)) {
      logger.warn(`deleteDomain failed - invalid ID: ${c.req.param("id")}`, "DomainController");
      return c.json({ success: false, message: "Invalid ID parameter", error: null }, 400);
    }
    this.domainUseCase.deleteDomain(id);
    return c.json({
      success: true,
      message: "Domain deleted successfully",
      data: null
    });
  }

  async getPublicDomains(c: Context): Promise<Response> {
    const list = this.domainUseCase.getPublicDomainList();
    return c.json(list);
  }

  async importDomains(c: Context): Promise<Response> {
    const data = (c.req.valid as any)("json") as string[];
    const count = this.domainUseCase.importFromJSON(data);
    return c.json({
      success: true,
      message: `Successfully imported ${count} domains`,
      data: { imported: count }
    });
  }
}
