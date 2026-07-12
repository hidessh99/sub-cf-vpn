import { Admin } from "../models/Admin";
import { ProxyIP } from "../models/ProxyIP";
import { Domain } from "../models/Domain";
import { Bug } from "../models/Bug";
import { CreateProxyRequest, UpdateProxyRequest, ImportProxyItem } from "../dto/proxy.dto";
import { PublicProxyItem } from "../dto/response.dto";
import { DashboardStats } from "./DashboardUseCase";

export interface IAuthUseCase {
  login(username: string, passwordPlain: string): Promise<{ token: string; admin: Omit<Admin, "password"> }>;
  getProfile(adminId: number): Promise<Omit<Admin, "password">>;
  changePassword(adminId: number, oldPasswordPlain: string, newPasswordPlain: string): Promise<void>;
}

export interface IProxyUseCase {
  getAllProxies(
    page: number,
    limit: number,
    filters?: { country?: string; is_active?: boolean; search?: string }
  ): { data: ProxyIP[]; total: number };
  createProxy(data: CreateProxyRequest): ProxyIP;
  updateProxy(id: number, data: UpdateProxyRequest): ProxyIP;
  deleteProxy(id: number): void;
  importFromJSON(list: ImportProxyItem[]): number;
  getPublicProxyList(): PublicProxyItem[];
  getPublicProxyListGrouped(): Record<string, string[]>;
  lookupGeoIP(ip: string): Promise<any>;
  syncHealthCheck(): void;
}

export interface IDomainUseCase {
  getAllDomains(): Domain[];
  createDomain(domainName: string): Domain;
  deleteDomain(id: number): void;
  getPublicDomainList(): string[];
  importFromJSON(list: string[]): number;
}

export interface IBugUseCase {
  getAllBugs(): Bug[];
  createBug(hostname: string): Bug;
  deleteBug(id: number): void;
  getPublicBugList(): string[];
  importFromJSON(list: string[]): number;
}

export interface IDashboardUseCase {
  getStats(): DashboardStats;
}
