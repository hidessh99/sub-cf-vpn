import { IAdminRepository } from "../repositories/interfaces";
import { verifyPassword, hashPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { Admin } from "../models/Admin";
import { UnauthorizedError, NotFoundError, ValidationError } from "../utils/errors";
import { logger } from "../utils/logger";

export class AuthUseCase {
  constructor(private adminRepo: IAdminRepository, private jwtSecret: string) {}

  async login(username: string, passwordPlain: string): Promise<{ token: string; admin: Omit<Admin, "password"> }> {
    const admin = await this.adminRepo.findByUsername(username);
    if (!admin || !admin.password) {
      logger.warn(`Login failed - user not found: ${username}`, "AuthUseCase");
      throw new UnauthorizedError("Invalid username or password");
    }

    const isValid = await verifyPassword(passwordPlain, admin.password);
    if (!isValid) {
      logger.warn(`Login failed - invalid password for user: ${username}`, "AuthUseCase");
      throw new UnauthorizedError("Invalid username or password");
    }

    // Generate token
    const token = await signToken({ id: admin.id, username: admin.username }, this.jwtSecret);
    
    // Exclude password from return
    const { password, ...adminInfo } = admin;

    return {
      token,
      admin: adminInfo,
    };
  }

  async getProfile(adminId: number): Promise<Omit<Admin, "password">> {
    logger.debug(`Fetching profile for admin id=${adminId}`, "AuthUseCase");

    const admin = await this.adminRepo.findById(adminId);
    if (!admin) {
      logger.warn(`Profile not found for admin id=${adminId}`, "AuthUseCase");
      throw new NotFoundError("Admin not found");
    }

    const { password, ...adminInfo } = admin;
    return adminInfo;
  }

  async changePassword(adminId: number, oldPasswordPlain: string, newPasswordPlain: string): Promise<void> {
    const admin = await this.adminRepo.findById(adminId);
    if (!admin || !admin.password) {
      logger.warn(`Password change failed - admin not found: id=${adminId}`, "AuthUseCase");
      throw new NotFoundError("Admin not found");
    }

    const isValid = await verifyPassword(oldPasswordPlain, admin.password);
    if (!isValid) {
      logger.warn(`Password change failed - incorrect current password for admin id=${adminId}`, "AuthUseCase");
      throw new ValidationError("Incorrect current password");
    }

    const newHashed = await hashPassword(newPasswordPlain);
    await this.adminRepo.updatePassword(adminId, newHashed);
  }
}
