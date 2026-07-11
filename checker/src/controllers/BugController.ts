import { BugUseCase } from "../usecases/BugUseCase";
import { successResponse, jsonResponse } from "../utils/response";
import { AuthContext } from "../middlewares/authMiddleware";
import { CreateBugRequestSchema } from "../dto/bug.dto";
import { ValidationError, UnauthorizedError } from "../utils/errors";
import { z } from "zod";

export class BugController {
  constructor(private bugUseCase: BugUseCase) {}

  async getBugs(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) throw new UnauthorizedError("Unauthorized");
    const list = this.bugUseCase.getAllBugs();
    return successResponse(list, "Bugs retrieved successfully");
  }

  async createBug(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) throw new UnauthorizedError("Unauthorized");

    const body = await request.json().catch(() => ({}));
    const parsed = CreateBugRequestSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map(e => e.message).join(", ");
      throw new ValidationError(msg);
    }

    const { hostname } = parsed.data;
    const result = this.bugUseCase.createBug(hostname);
    return successResponse(result, "Bug created successfully", 201);
  }

  async deleteBug(id: number, admin: AuthContext | null): Promise<Response> {
    if (!admin) throw new UnauthorizedError("Unauthorized");
    this.bugUseCase.deleteBug(id);
    return successResponse(null, "Bug deleted successfully");
  }

  async getPublicBugs(): Promise<Response> {
    const list = this.bugUseCase.getPublicBugList();
    return jsonResponse(list);
  }

  async importBugs(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) throw new UnauthorizedError("Unauthorized");

    const body = await request.json().catch(() => []);
    const parsed = z.array(z.string().min(1)).safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Import data must be a JSON array of non-empty strings");
    }

    const count = this.bugUseCase.importFromJSON(parsed.data);
    return successResponse({ imported: count }, `Successfully imported ${count} bug hostnames`);
  }
}
