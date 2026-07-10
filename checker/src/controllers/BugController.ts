import { BugUseCase } from "../usecases/BugUseCase";
import { successResponse, errorResponse, jsonResponse } from "../utils/response";
import { AuthContext } from "../middlewares/authMiddleware";
import { CreateBugRequest } from "../dto/bug.dto";

export class BugController {
  private bugUseCase = new BugUseCase();

  async getBugs(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) return errorResponse("Unauthorized", 401);

    try {
      const list = this.bugUseCase.getAllBugs();
      return successResponse(list, "Bugs retrieved successfully");
    } catch (e: any) {
      return errorResponse(e.message || "Failed to fetch bugs", 400);
    }
  }

  async createBug(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) return errorResponse("Unauthorized", 401);

    try {
      const body = await request.json() as CreateBugRequest;
      const { hostname } = body;

      if (!hostname) {
        return errorResponse("Hostname field is required", 400);
      }

      const result = this.bugUseCase.createBug(hostname);
      return successResponse(result, "Bug created successfully", 201);
    } catch (e: any) {
      return errorResponse(e.message || "Failed to create bug", 400);
    }
  }

  async deleteBug(id: number, admin: AuthContext | null): Promise<Response> {
    if (!admin) return errorResponse("Unauthorized", 401);

    try {
      this.bugUseCase.deleteBug(id);
      return successResponse(null, "Bug deleted successfully");
    } catch (e: any) {
      return errorResponse(e.message || "Failed to delete bug", 400);
    }
  }

  async getPublicBugs(): Promise<Response> {
    try {
      const list = this.bugUseCase.getPublicBugList();
      // Return raw array of strings to match static bug_list.json
      return jsonResponse(list);
    } catch (e: any) {
      return errorResponse("Failed to fetch public bugs", 500);
    }
  }
}
