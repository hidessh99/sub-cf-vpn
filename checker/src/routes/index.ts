import { AuthController } from "../controllers/AuthController";
import { ProxyController } from "../controllers/ProxyController";
import { DomainController } from "../controllers/DomainController";
import { BugController } from "../controllers/BugController";
import { DashboardController } from "../controllers/DashboardController";
import { authenticateRequest } from "../middlewares/authMiddleware";
import { errorResponse, corsResponse } from "../utils/response";

const authController = new AuthController();
const proxyController = new ProxyController();
const domainController = new DomainController();
const bugController = new BugController();
const dashboardController = new DashboardController();

export async function handleApiRoute(request: Request): Promise<Response> {
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
    return authController.login(request);
  }
  if (pathname === "/api/v1/auth/me" && method === "GET") {
    return authController.getProfile(admin);
  }
  if (pathname === "/api/v1/auth/password" && method === "PUT") {
    return authController.changePassword(request, admin);
  }

  // --- Public Configuration Routes ---
  if (pathname === "/api/v1/public/proxies" && method === "GET") {
    return proxyController.getPublicProxies();
  }
  if (pathname === "/api/v1/public/proxies/grouped" && method === "GET") {
    return proxyController.PublicProxi();
  }
  if (pathname === "/api/v1/public/domains" && method === "GET") {
    return domainController.getPublicDomains();
  }
  if (pathname === "/api/v1/public/bugs" && method === "GET") {
    return bugController.getPublicBugs();
  }

  // --- Proxy Routes ---
  if (pathname === "/api/v1/proxies" && method === "GET") {
    return proxyController.getProxies(request, admin);
  }
  if (pathname === "/api/v1/proxies" && method === "POST") {
    return proxyController.createProxy(request, admin);
  }
  if (pathname === "/api/v1/proxies/import" && method === "POST") {
    return proxyController.importProxies(request, admin);
  }
  if (pathname === "/api/v1/proxies/sync-health" && method === "POST") {
    return proxyController.syncHealth(admin);
  }
  const proxyIdMatch = pathname.match(/^\/api\/v1\/proxies\/(\d+)$/);
  if (proxyIdMatch) {
    const id = parseInt(proxyIdMatch[1], 10);
    if (method === "PUT") {
      return proxyController.updateProxy(id, request, admin);
    }
    if (method === "DELETE") {
      return proxyController.deleteProxy(id, admin);
    }
  }

  // --- Domain Routes ---
  if (pathname === "/api/v1/domains" && method === "GET") {
    return domainController.getDomains(request, admin);
  }
  if (pathname === "/api/v1/domains" && method === "POST") {
    return domainController.createDomain(request, admin);
  }
  const domainIdMatch = pathname.match(/^\/api\/v1\/domains\/(\d+)$/);
  if (domainIdMatch && method === "DELETE") {
    const id = parseInt(domainIdMatch[1], 10);
    return domainController.deleteDomain(id, admin);
  }

  // --- Bug Routes ---
  if (pathname === "/api/v1/bugs" && method === "GET") {
    return bugController.getBugs(request, admin);
  }
  if (pathname === "/api/v1/bugs" && method === "POST") {
    return bugController.createBug(request, admin);
  }
  const bugIdMatch = pathname.match(/^\/api\/v1\/bugs\/(\d+)$/);
  if (bugIdMatch && method === "DELETE") {
    const id = parseInt(bugIdMatch[1], 10);
    return bugController.deleteBug(id, admin);
  }

  // --- Dashboard Routes ---
  if (pathname === "/api/v1/dashboard/stats" && method === "GET") {
    return dashboardController.getStats(request, admin);
  }

  // Route not found
  return errorResponse(`Route not found: ${method} ${pathname}`, 404);
}
