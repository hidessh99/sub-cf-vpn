import { expect, test, describe } from "bun:test";
import { ProxyUseCase } from "./ProxyUseCase";
import { IProxyRepository } from "../repositories/interfaces";
import { ProxyIP } from "../models/ProxyIP";

class MockProxyRepository implements IProxyRepository {
  private db: ProxyIP[] = [];
  
  findAll(page: number, limit: number, filters: any = {}): { data: ProxyIP[]; total: number } {
    let list = this.db;
    if (filters.search) {
      list = list.filter(p => p.ip.includes(filters.search) || p.proxy.includes(filters.search));
    }
    const total = list.length;
    const start = (page - 1) * limit;
    const data = list.slice(start, start + limit);
    return { data, total };
  }

  findById(id: number): ProxyIP | null {
    return this.db.find(p => p.id === id) || null;
  }

  create(p: Omit<ProxyIP, "id" | "created_at" | "updated_at">): ProxyIP {
    const newProxy: ProxyIP = {
      id: this.db.length + 1,
      ...p,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.db.push(newProxy);
    return newProxy;
  }

  update(id: number, p: Partial<ProxyIP>): ProxyIP {
    const index = this.db.findIndex(item => item.id === id);
    if (index === -1) throw new Error("Not found");
    this.db[index] = { ...this.db[index], ...p, updated_at: new Date().toISOString() };
    return this.db[index];
  }

  delete(id: number): void {
    this.db = this.db.filter(p => p.id !== id);
  }

  bulkCreate(proxies: Omit<ProxyIP, "id" | "created_at" | "updated_at">[]): number {
    proxies.forEach(p => this.create(p));
    return proxies.length;
  }

  getPublicList(): any[] {
    return this.db.filter(p => p.is_active).map(p => ({
      proxy: p.proxy,
      port: p.port,
      proxyip: p.proxyip,
      ip: p.ip,
      latency: p.latency
    }));
  }

  count(): number {
    return this.db.length;
  }

  findAllActive(): ProxyIP[] {
    return this.db.filter(p => p.is_active);
  }

  bulkDelete(ids: number[]): number {
    const originalCount = this.db.length;
    this.db = this.db.filter(p => !ids.includes(p.id));
    return originalCount - this.db.length;
  }
}

describe("ProxyUseCase", () => {
  test("should create a new proxy successfully", () => {
    const repo = new MockProxyRepository();
    const useCase = new ProxyUseCase(repo);

    const result = useCase.createProxy({
      ip: "127.0.0.1",
      proxy: "my-proxy",
      port: "8080",
      proxyip: true,
      latency: 120
    });

    expect(result.id).toBe(1);
    expect(result.ip).toBe("127.0.0.1");
    expect(result.proxy).toBe("my-proxy");
    expect(result.port).toBe("8080");
    expect(repo.count()).toBe(1);
  });

  test("should throw ValidationError if IP is missing when creating a proxy", () => {
    const repo = new MockProxyRepository();
    const useCase = new ProxyUseCase(repo);

    expect(() => {
      useCase.createProxy({
        ip: "",
        proxy: "my-proxy",
        port: "8080"
      });
    }).toThrow("IP field is required");
  });

  test("should list proxies with pagination", () => {
    const repo = new MockProxyRepository();
    const useCase = new ProxyUseCase(repo);

    // Seed mock database
    useCase.createProxy({ ip: "1.1.1.1", port: "443" });
    useCase.createProxy({ ip: "2.2.2.2", port: "443" });
    useCase.createProxy({ ip: "3.3.3.3", port: "443" });

    const page1 = useCase.getAllProxies(1, 2);
    expect(page1.total).toBe(3);
    expect(page1.data.length).toBe(2);
    expect(page1.data[0].ip).toBe("1.1.1.1");
    expect(page1.data[1].ip).toBe("2.2.2.2");

    const page2 = useCase.getAllProxies(2, 2);
    expect(page2.total).toBe(3);
    expect(page2.data.length).toBe(1);
    expect(page2.data[0].ip).toBe("3.3.3.3");
  });
});
