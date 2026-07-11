import { db } from "../../database/database";
import { AdminRepository } from "../repositories/AdminRepository";
import { ProxyRepository } from "../repositories/ProxyRepository";
import { DomainRepository } from "../repositories/DomainRepository";
import { BugRepository } from "../repositories/BugRepository";

import { AuthUseCase } from "../usecases/AuthUseCase";
import { ProxyUseCase } from "../usecases/ProxyUseCase";
import { DomainUseCase } from "../usecases/DomainUseCase";
import { BugUseCase } from "../usecases/BugUseCase";
import { DashboardUseCase } from "../usecases/DashboardUseCase";

import { AuthController } from "../controllers/AuthController";
import { ProxyController } from "../controllers/ProxyController";
import { DomainController } from "../controllers/DomainController";
import { BugController } from "../controllers/BugController";
import { DashboardController } from "../controllers/DashboardController";
import { SystemController } from "../controllers/SystemController";

import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

// 1. Repositories
export const adminRepo = new AdminRepository(db);
export const proxyRepo = new ProxyRepository(db);
export const domainRepo = new DomainRepository(db);
export const bugRepo = new BugRepository(db);

// 2. Use Cases
export const authUseCase = new AuthUseCase(adminRepo);
export const proxyUseCase = new ProxyUseCase(proxyRepo);
export const domainUseCase = new DomainUseCase(domainRepo);
export const bugUseCase = new BugUseCase(bugRepo);
export const dashboardUseCase = new DashboardUseCase(proxyRepo, domainRepo, bugRepo);

// 3. Controllers
export const authController = new AuthController(authUseCase);
export const proxyController = new ProxyController(proxyUseCase);
export const domainController = new DomainController(domainUseCase);
export const bugController = new BugController(bugUseCase);
export const dashboardController = new DashboardController(dashboardUseCase);
export const systemController = new SystemController();

// 4. Custom validation middleware helpers
export const validateJson = (schema: z.ZodSchema) => 
  zValidator("json", schema, (result, c) => {
    if (!result.success) {
      const msg = (result as any).error.errors.map((e: any) => e.message).join(", ");
      return c.json({ success: false, message: msg, error: null }, 400);
    }
  });

export const validateProxyJson = (schema: z.ZodSchema) => 
  zValidator("json", schema, (result, c) => {
    if (!result.success) {
      const msg = (result as any).error.errors.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return c.json({ success: false, message: msg, error: null }, 400);
    }
  });

export const validateProxyImportJson = (schema: z.ZodSchema) => 
  zValidator("json", schema, (result, c) => {
    if (!result.success) {
      const msg = (result as any).error.errors.map((e: any) => `[Item ${e.path.join(".")}]: ${e.message}`).join(", ");
      return c.json({ success: false, message: `Invalid import format: ${msg}`, error: null }, 400);
    }
  });

export const validateArrayOfStringsJson = () =>
  zValidator("json", z.array(z.string().min(1)), (result, c) => {
    if (!result.success) {
      return c.json({
        success: false,
        message: "Import data must be a JSON array of non-empty strings",
        error: null
      }, 400);
    }
  });
