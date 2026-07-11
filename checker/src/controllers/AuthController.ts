import { AuthUseCase } from "../usecases/AuthUseCase";
import { successResponse, errorResponse } from "../utils/response";
import { AuthContext } from "../middlewares/authMiddleware";
import { LoginRequest, ChangePasswordRequest } from "../dto/auth.dto";

export class AuthController {
  constructor(private authUseCase: AuthUseCase) {}

  async login(request: Request): Promise<Response> {
    try {
      const body = await request.json() as LoginRequest;
      const { username, password } = body;
      
      if (!username || !password) {
        return errorResponse("Username and password are required", 400);
      }

      const result = await this.authUseCase.login(username, password);
      return successResponse(result, "Login successful");
    } catch (e: any) {
      return errorResponse(e.message || "Invalid credentials", 401);
    }
  }

  async getProfile(admin: AuthContext | null): Promise<Response> {
    if (!admin) {
      return errorResponse("Unauthorized", 401);
    }

    try {
      const profile = await this.authUseCase.getProfile(admin.id);
      return successResponse(profile, "Profile retrieved successfully");
    } catch (e: any) {
      return errorResponse(e.message || "Failed to retrieve profile", 400);
    }
  }

  async changePassword(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) {
      return errorResponse("Unauthorized", 401);
    }

    try {
      const body = await request.json() as ChangePasswordRequest;
      const { oldPassword, newPassword } = body;

      if (!oldPassword || !newPassword) {
        return errorResponse("Old password and new password are required", 400);
      }

      await this.authUseCase.changePassword(admin.id, oldPassword, newPassword);
      return successResponse(null, "Password changed successfully");
    } catch (e: any) {
      return errorResponse(e.message || "Failed to change password", 400);
    }
  }
}
