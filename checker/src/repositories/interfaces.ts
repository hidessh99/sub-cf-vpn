import { Admin } from "../models/Admin";
import { Bug } from "../models/Bug";
import { Domain } from "../models/Domain";
import { ProxyIP } from "../models/ProxyIP";
import { PublicProxyItem } from "../dto/response.dto";

export interface IAdminRepository {
  findByUsername(username: string): Admin | null;
  findById(id: number): Admin | null;
  updatePassword(id: number, newHashedPassword: string): void;
}

export interface IBugRepository {
  findAll(): Bug[];
  findByHostname(hostname: string): Bug | null;
  create(hostname: string): Bug;
  delete(id: number): void;
  bulkCreate(bugs: string[]): number;
  getPublicList(): string[];
  count(): number;
}

export interface IDomainRepository {
  findAll(): Domain[];
  findByDomain(domain: string): Domain | null;
  create(domain: string): Domain;
  delete(id: number): void;
  bulkCreate(domains: string[]): number;
  getPublicList(): string[];
  count(): number;
}

export interface IProxyRepository {
  findAll(
    page: number,
    limit: number,
    filters?: { country?: string; is_active?: boolean; search?: string }
  ): { data: ProxyIP[]; total: number };
  findById(id: number): ProxyIP | null;
  create(p: Omit<ProxyIP, "id" | "created_at" | "updated_at">): ProxyIP;
  update(id: number, p: Partial<ProxyIP>): ProxyIP;
  delete(id: number): void;
  bulkCreate(proxies: Omit<ProxyIP, "id" | "created_at" | "updated_at">[]): number;
  getPublicList(): PublicProxyItem[];
  count(): number;
  findAllActive(): ProxyIP[];
  bulkDelete(ids: number[]): number;
}
