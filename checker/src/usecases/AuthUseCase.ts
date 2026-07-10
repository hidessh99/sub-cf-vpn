import { AdminRepository } from "../repositories/AdminRepository";
import { verifyPassword, hashPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { Admin } from "../models/Admin";

export class AuthUseCase {
  private adminRepo = new AdminRepository();

  async login(username: string, passwordPlain: string): Promise<{ token: string; admin: Omit<Admin, "password"> }> {
    const admin = this.adminRepo.findByUsername(username);
    if (!admin || !admin.password) {
      throw new Error("Invalid username or password");
    }

    const isValid = await verifyPassword(passwordPlain, admin.password);
    if (!isValid) {
      throw new Error("Invalid username or password");
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
      throw new Error("Admin not found");
    }

    const { password, ...adminInfo } = admin;
    return adminInfo;
  }

  async changePassword(adminId: number, oldPasswordPlain: string, newPasswordPlain: string): Promise<void> {
    const admin = this.adminRepo.findById(adminId);
    if (!admin || !admin.password) {
      throw new Error("Admin not found");
    }

    const isValid = await verifyPassword(oldPasswordPlain, admin.password);
    if (!isValid) {
      throw new Error("Incorrect current password");
    }

    const newHashed = await hashPassword(newPasswordPlain);
    this.adminRepo.updatePassword(adminId, newHashed);
  }
}
