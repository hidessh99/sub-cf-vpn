import { db } from "../../database/database";
import { AdminRepository } from "../repositories/AdminRepository";
import { ProxyRepository } from "../repositories/ProxyRepository";
import { DomainRepository } from "../repositories/DomainRepository";
import { BugRepository } from "../repositories/BugRepository";

import { AuthUseCase } from "../usecases/AuthUseCase";
import { ProxyUseCase } from "../usecases/ProxyUseCase";
import { DomainUseCase } from "../usecases/DomainUseCase";
import { BugUseCase } from "../usecases/BugUseCase";

import { AuthController } from "../controllers/AuthController";
import { ProxyController } from "../controllers/ProxyController";
import { DomainController } from "../controllers/DomainController";
import { BugController } from "../controllers/BugController";
import { DashboardController } from "../controllers/DashboardController";
import { SystemController } from "../controllers/SystemController";

import { authenticateRequest } from "../middlewares/authMiddleware";
import { errorResponse, corsResponse } from "../utils/response";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

// ==========================================
// 🔩 Manual Dependency Injection Bootstrap
// ==========================================

// 1. Repositories
const adminRepo = new AdminRepository(db);
const proxyRepo = new ProxyRepository(db);
const domainRepo = new DomainRepository(db);
const bugRepo = new BugRepository(db);

// 2. Use Cases
const authUseCase = new AuthUseCase(adminRepo);
const proxyUseCase = new ProxyUseCase(proxyRepo);
const domainUseCase = new DomainUseCase(domainRepo);
const bugUseCase = new BugUseCase(bugRepo);

// 3. Controllers
const authController = new AuthController(authUseCase);
const proxyController = new ProxyController(proxyUseCase);
const domainController = new DomainController(domainUseCase);
const bugController = new BugController(bugUseCase);
const dashboardController = new DashboardController(proxyRepo, domainRepo, bugRepo);
const systemController = new SystemController();

// ==========================================
// 🛣️ Centralized Routing & Error Handling
// ==========================================

export async function handleApiRoute(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === "OPTIONS") {
      return corsResponse();
    }

    // Extract authentication state if token is provided
    const admin = await authenticateRequest(request);

    // --- Auth Routes ---
    if (pathname === "/api/v1/auth/login" && method === "POST") {
      return await authController.login(request);
    }
    if (pathname === "/api/v1/auth/me" && method === "GET") {
      return await authController.getProfile(admin);
    }
    if (pathname === "/api/v1/auth/password" && method === "PUT") {
      return await authController.changePassword(request, admin);
    }

    // --- System & Checker Routes ---
    if ((pathname === "/health" || pathname === "/") && method === "GET") {
      return await systemController.healthCheck();
    }
    if (pathname.startsWith("/api/check") && method === "GET") {
      return await proxyController.checkProxies(request);
    }

    // --- Public Configuration Routes ---
    if (pathname === "/api/v1/public/proxies" && method === "GET") {
      return await proxyController.getPublicProxies();
    }
    if (pathname === "/api/v1/public/proxies/grouped" && method === "GET") {
      return await proxyController.PublicProxi();
    }
    if (pathname === "/api/v1/public/domains" && method === "GET") {
      return await domainController.getPublicDomains();
    }
    if (pathname === "/api/v1/public/bugs" && method === "GET") {
      return await bugController.getPublicBugs();
    }

    // --- Proxy Routes ---
    if (pathname === "/api/v1/proxies" && method === "GET") {
      return await proxyController.getProxies(request, admin);
    }
    if (pathname === "/api/v1/proxies" && method === "POST") {
      return await proxyController.createProxy(request, admin);
    }
    if (pathname === "/api/v1/proxies/import" && method === "POST") {
      return await proxyController.importProxies(request, admin);
    }
    if (pathname === "/api/v1/proxies/sync-health" && method === "POST") {
      return await proxyController.syncHealth(admin);
    }
    if (pathname === "/api/v1/proxies/geoip" && method === "GET") {
      return await proxyController.geoipLookup(request, admin);
    }
    const proxyIdMatch = pathname.match(/^\/api\/v1\/proxies\/(\d+)$/);
    if (proxyIdMatch) {
      const id = parseInt(proxyIdMatch[1], 10);
      if (method === "PUT") {
        return await proxyController.updateProxy(id, request, admin);
      }
      if (method === "DELETE") {
        return await proxyController.deleteProxy(id, admin);
      }
    }

    // --- Domain Routes ---
    if (pathname === "/api/v1/domains" && method === "GET") {
      return await domainController.getDomains(request, admin);
    }
    if (pathname === "/api/v1/domains" && method === "POST") {
      return await domainController.createDomain(request, admin);
    }
    if (pathname === "/api/v1/domains/import" && method === "POST") {
      return await domainController.importDomains(request, admin);
    }
    const domainIdMatch = pathname.match(/^\/api\/v1\/domains\/(\d+)$/);
    if (domainIdMatch && method === "DELETE") {
      const id = parseInt(domainIdMatch[1], 10);
      return await domainController.deleteDomain(id, admin);
    }

    // --- Bug Routes ---
    if (pathname === "/api/v1/bugs" && method === "GET") {
      return await bugController.getBugs(request, admin);
    }
    if (pathname === "/api/v1/bugs" && method === "POST") {
      return await bugController.createBug(request, admin);
    }
    if (pathname === "/api/v1/bugs/import" && method === "POST") {
      return await bugController.importBugs(request, admin);
    }
    const bugIdMatch = pathname.match(/^\/api\/v1\/bugs\/(\d+)$/);
    if (bugIdMatch && method === "DELETE") {
      const id = parseInt(bugIdMatch[1], 10);
      return await bugController.deleteBug(id, admin);
    }

    // --- Dashboard Routes ---
    if (pathname === "/api/v1/dashboard/stats" && method === "GET") {
      return await dashboardController.getStats(request, admin);
    }

    // Route not found
    throw new AppError(`Route not found: ${method} ${pathname}`, 404);
  } catch (error: any) {
    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode);
    }
    
    // Log unexpected errors
    logger.error("Unexpected error occurred during routing", error, "Router");
    return errorResponse(error.message || "Internal Server Error", 500);
  }
}
