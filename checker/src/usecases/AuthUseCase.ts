import { IAdminRepository } from "../repositories/interfaces";
import { verifyPassword, hashPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { Admin } from "../models/Admin";
import { UnauthorizedError, NotFoundError, ValidationError } from "../utils/errors";

export class AuthUseCase {
  constructor(private adminRepo: IAdminRepository) {}

  async login(username: string, passwordPlain: string): Promise<{ token: string; admin: Omit<Admin, "password"> }> {
    const admin = this.adminRepo.findByUsername(username);
    if (!admin || !admin.password) {
      throw new UnauthorizedError("Invalid username or password");
    }

    const isValid = await verifyPassword(passwordPlain, admin.password);
    if (!isValid) {
      throw new UnauthorizedError("Invalid username or password");
    }

    // Generate token
    const token = await signToken({ id: admin.id, username: admin.username });
    
    // Exclude password from return
    const { password, ...adminInfo } = admin;

    return {
      token,
      admin: adminInfo,
    };
  }

  async getProfile(adminId: number): Promise<Omit<Admin, "password">> {
    const admin = this.adminRepo.findById(adminId);
    if (!admin) {
      throw new NotFoundError("Admin not found");
    }

    const { password, ...adminInfo } = admin;
    return adminInfo;
  }

  async changePassword(adminId: number, oldPasswordPlain: string, newPasswordPlain: string): Promise<void> {
    const admin = this.adminRepo.findById(adminId);
    if (!admin || !admin.password) {
      throw new NotFoundError("Admin not found");
    }

    const isValid = await verifyPassword(oldPasswordPlain, admin.password);
    if (!isValid) {
      throw new ValidationError("Incorrect current password");
    }

    const newHashed = await hashPassword(newPasswordPlain);
    this.adminRepo.updatePassword(adminId, newHashed);
  }
}
