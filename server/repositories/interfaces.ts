import { Admin } from "../models/Admin";
import { Bug } from "../models/Bug";
import { Domain } from "../models/Domain";
import { ProxyIP } from "../models/ProxyIP";
import { PublicProxyItem } from "../dto/response.dto";

export interface IAdminRepository {
  findByUsername(username: string): Promise<Admin | null>;
  findById(id: number): Promise<Admin | null>;
  updatePassword(id: number, newHashedPassword: string): Promise<void>;
}

export interface IBugRepository {
  findAll(): Promise<Bug[]>;
  findByHostname(hostname: string): Promise<Bug | null>;
  create(hostname: string): Promise<Bug>;
  delete(id: number): Promise<void>;
  bulkCreate(bugs: string[]): Promise<number>;
  getPublicList(): Promise<string[]>;
  count(): Promise<number>;
}

export interface IDomainRepository {
  findAll(): Promise<Domain[]>;
  findByDomain(domain: string): Promise<Domain | null>;
  create(domain: string): Promise<Domain>;
  delete(id: number): Promise<void>;
  bulkCreate(domains: string[]): Promise<number>;
  getPublicList(): Promise<string[]>;
  count(): Promise<number>;
}

export interface IProxyRepository {
  findAll(
    page: number,
    limit: number,
    filters?: { country?: string; is_active?: boolean; search?: string }
  ): Promise<{ data: ProxyIP[]; total: number }>;
  findById(id: number): Promise<ProxyIP | null>;
  create(p: Omit<ProxyIP, "id" | "created_at" | "updated_at">): Promise<ProxyIP>;
  update(id: number, p: Partial<ProxyIP>): Promise<ProxyIP>;
  delete(id: number): Promise<void>;
  bulkCreate(proxies: Omit<ProxyIP, "id" | "created_at" | "updated_at">[]): Promise<number>;
  getPublicList(): Promise<PublicProxyItem[]>;
  count(): Promise<number>;
  findAllActive(): Promise<ProxyIP[]>;
  bulkDelete(ids: number[]): Promise<number>;
}
