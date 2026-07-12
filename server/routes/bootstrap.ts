import { AdminRepository } from "../repositories/AdminRepository";
import { ProxyRepository } from "../repositories/ProxyRepository";
import { DomainRepository } from "../repositories/DomainRepository";
import { BugRepository } from "../repositories/BugRepository";

import { AuthUseCase } from "../usecases/AuthUseCase";
import { ProxyUseCase } from "../usecases/ProxyUseCase";
import { DomainUseCase } from "../usecases/DomainUseCase";
import { BugUseCase } from "../usecases/BugUseCase";
import { DashboardUseCase } from "../usecases/DashboardUseCase";

import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export function createServices(db: D1Database, jwtSecret: string) {
  // Repositories
  const adminRepo = new AdminRepository(db);
  const proxyRepo = new ProxyRepository(db);
  const domainRepo = new DomainRepository(db);
  const bugRepo = new BugRepository(db);

  // Use Cases
  const authUseCase = new AuthUseCase(adminRepo, jwtSecret);
  const proxyUseCase = new ProxyUseCase(proxyRepo);
  const domainUseCase = new DomainUseCase(domainRepo);
  const bugUseCase = new BugUseCase(bugRepo);
  const dashboardUseCase = new DashboardUseCase(proxyRepo, domainRepo, bugRepo);

  return {
    authUseCase,
    proxyUseCase,
    domainUseCase,
    bugUseCase,
    dashboardUseCase,
  };
}

// Custom validation middleware helpers
export const validateJson = (schema: z.ZodSchema) => 
  zValidator("json", schema, (result, c) => {
    if (!result.success) {
      const errors = (result as any).error.errors.map((e: any) => {
        const field = e.path.length > 0 ? e.path.join(".") : "input";
        return `${field}: ${e.message}`;
      });
      return c.json({
        success: false,
        message: "Validation failed",
        errors,
        error: null
      }, 400);
    }
  });

export const validateProxyJson = (schema: z.ZodSchema) => 
  zValidator("json", schema, (result, c) => {
    if (!result.success) {
      const errors = (result as any).error.errors.map((e: any) => {
        const field = e.path.length > 0 ? e.path.join(".") : "input";
        return `${field}: ${e.message}`;
      });
      return c.json({
        success: false,
        message: "Validation failed",
        errors,
        error: null
      }, 400);
    }
  });

export const validateProxyImportJson = (schema: z.ZodSchema) => 
  zValidator("json", schema, (result, c) => {
    if (!result.success) {
      const errors = (result as any).error.errors.map((e: any) => {
        const field = e.path.length > 0 ? `Item ${e.path.join(".")}` : "input";
        return `${field}: ${e.message}`;
      });
      return c.json({
        success: false,
        message: "Invalid import format",
        errors,
        error: null
      }, 400);
    }
  });

export const validateArrayOfStringsJson = () =>
  zValidator("json", z.array(z.string().min(1)), (result, c) => {
    if (!result.success) {
      return c.json({
        success: false,
        message: "Import data must be a JSON array of non-empty strings",
        errors: ["input: Import data must be a JSON array of non-empty strings"],
        error: null
      }, 400);
    }
  });
