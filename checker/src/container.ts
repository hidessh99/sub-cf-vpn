import { db } from "../database/database";
import { AdminRepository } from "./repositories/AdminRepository";
import { ProxyRepository } from "./repositories/ProxyRepository";
import { DomainRepository } from "./repositories/DomainRepository";
import { BugRepository } from "./repositories/BugRepository";

import { AuthUseCase } from "./usecases/AuthUseCase";
import { ProxyUseCase } from "./usecases/ProxyUseCase";
import { DomainUseCase } from "./usecases/DomainUseCase";
import { BugUseCase } from "./usecases/BugUseCase";
import { DashboardUseCase } from "./usecases/DashboardUseCase";

import { AuthController } from "./controllers/AuthController";
import { ProxyController } from "./controllers/ProxyController";
import { DomainController } from "./controllers/DomainController";
import { BugController } from "./controllers/BugController";
import { DashboardController } from "./controllers/DashboardController";
import { SystemController } from "./controllers/SystemController";

import { GeoIPService } from "./services/GeoIPService";

// 1. Repositories
export const adminRepo = new AdminRepository(db);
export const proxyRepo = new ProxyRepository(db);
export const domainRepo = new DomainRepository(db);
export const bugRepo = new BugRepository(db);

// 2. Services
export const geoIPService = new GeoIPService();

// 3. Use Cases
export const authUseCase = new AuthUseCase(adminRepo);
export const proxyUseCase = new ProxyUseCase(proxyRepo, geoIPService);
export const domainUseCase = new DomainUseCase(domainRepo);
export const bugUseCase = new BugUseCase(bugRepo);
export const dashboardUseCase = new DashboardUseCase(proxyRepo, domainRepo, bugRepo);

// 4. Controllers
export const authController = new AuthController(authUseCase);
export const proxyController = new ProxyController(proxyUseCase);
export const domainController = new DomainController(domainUseCase);
export const bugController = new BugController(bugUseCase);
export const dashboardController = new DashboardController(dashboardUseCase);
export const systemController = new SystemController(db);
