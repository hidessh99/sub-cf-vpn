import { AuthUseCase } from "../usecases/AuthUseCase";
import { successResponse } from "../utils/response";
import { AuthContext } from "../middlewares/authMiddleware";
import { LoginRequestSchema, ChangePasswordRequestSchema } from "../dto/auth.dto";
import { ValidationError, UnauthorizedError } from "../utils/errors";

export class AuthController {
  constructor(private authUseCase: AuthUseCase) {}

  async login(request: Request): Promise<Response> {
    const body = await request.json().catch(() => ({}));
    const parsed = LoginRequestSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map(e => e.message).join(", ");
      throw new ValidationError(msg);
    }

    const { username, password } = parsed.data;
    const result = await this.authUseCase.login(username, password);
    return successResponse(result, "Login successful");
  }

  async getProfile(admin: AuthContext | null): Promise<Response> {
    if (!admin) {
      throw new UnauthorizedError("Unauthorized");
    }

    const profile = await this.authUseCase.getProfile(admin.id);
    return successResponse(profile, "Profile retrieved successfully");
  }

  async changePassword(request: Request, admin: AuthContext | null): Promise<Response> {
    if (!admin) {
      throw new UnauthorizedError("Unauthorized");
    }

    const body = await request.json().catch(() => ({}));
    const parsed = ChangePasswordRequestSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map(e => e.message).join(", ");
      throw new ValidationError(msg);
    }

    const { oldPassword, newPassword } = parsed.data;
    await this.authUseCase.changePassword(admin.id, oldPassword, newPassword);
    return successResponse(null, "Password changed successfully");
  }
}
