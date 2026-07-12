import { expect, test, describe, beforeEach } from "bun:test";
import { AuthUseCase } from "../src/usecases/AuthUseCase";
import { MockAdminRepository } from "./mocks";
import { UnauthorizedError, NotFoundError, ValidationError } from "../src/utils/errors";

describe("AuthUseCase", () => {
  let adminRepo: MockAdminRepository;
  let authUseCase: AuthUseCase;

  beforeEach(async () => {
    adminRepo = new MockAdminRepository();
    authUseCase = new AuthUseCase(adminRepo);

    // Seed mock admin
    const hashedPassword = await Bun.password.hash("admin123", {
      algorithm: "argon2id",
      memoryCost: 65536,
      timeCost: 2
    });

    adminRepo.db.push({
      id: 1,
      username: "admin",
      password: hashedPassword,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });

  describe("login", () => {
    test("should login successfully with correct credentials", async () => {
      const result = await authUseCase.login("admin", "admin123");
      expect(result.token).toBeDefined();
      expect(result.admin.username).toBe("admin");
      expect(result.admin.id).toBe(1);
    });

    test("should throw UnauthorizedError with invalid username", async () => {
      expect(authUseCase.login("wrong-user", "admin123")).rejects.toThrow(
        new UnauthorizedError("Invalid username or password")
      );
    });

    test("should throw UnauthorizedError with invalid password", async () => {
      expect(authUseCase.login("admin", "wrong-password")).rejects.toThrow(
        new UnauthorizedError("Invalid username or password")
      );
    });
  });

  describe("getProfile", () => {
    test("should retrieve profile successfully", async () => {
      const profile = await authUseCase.getProfile(1);
      expect(profile.username).toBe("admin");
      expect(profile.id).toBe(1);
      expect((profile as any).password).toBeUndefined(); // Password must be excluded
    });

    test("should throw NotFoundError if admin id does not exist", async () => {
      expect(authUseCase.getProfile(999)).rejects.toThrow(
        new NotFoundError("Admin not found")
      );
    });
  });

  describe("changePassword", () => {
    test("should change password successfully with valid current password", async () => {
      await authUseCase.changePassword(1, "admin123", "newpassword123");
      
      // Verify login works with new password
      const loginResult = await authUseCase.login("admin", "newpassword123");
      expect(loginResult.token).toBeDefined();
    });

    test("should throw ValidationError with incorrect old password", async () => {
      expect(authUseCase.changePassword(1, "wrong-old-password", "newpassword123")).rejects.toThrow(
        new ValidationError("Incorrect current password")
      );
    });

    test("should throw NotFoundError if admin does not exist", async () => {
      expect(authUseCase.changePassword(999, "admin123", "newpassword123")).rejects.toThrow(
        new NotFoundError("Admin not found")
      );
    });
  });
});
