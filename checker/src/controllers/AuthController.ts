import { Context } from "hono";
import { IAuthUseCase } from "../usecases/interfaces";
import { LoginRequest, ChangePasswordRequest } from "../dto/auth.dto";

export class AuthController {
  constructor(private authUseCase: IAuthUseCase) {}

  async login(c: Context): Promise<Response> {
    const { username, password } = c.req.valid("json" as never) as LoginRequest;
    const result = await this.authUseCase.login(username, password);
    return c.json({
      success: true,
      message: "Login successful",
      data: result
    });
  }

  async getProfile(c: Context): Promise<Response> {
    const admin = c.get("admin");
    if (!admin) {
      return c.json({ success: false, message: "Unauthorized", error: null }, 401);
    }

    const profile = await this.authUseCase.getProfile(admin.id);
    return c.json({
      success: true,
      message: "Profile retrieved successfully",
      data: profile
    });
  }

  async changePassword(c: Context): Promise<Response> {
    const admin = c.get("admin");
    if (!admin) {
      return c.json({ success: false, message: "Unauthorized", error: null }, 401);
    }

    const { oldPassword, newPassword } = c.req.valid("json" as never) as ChangePasswordRequest;
    await this.authUseCase.changePassword(admin.id, oldPassword, newPassword);
    return c.json({
      success: true,
      message: "Password changed successfully",
      data: null
    });
  }
}
