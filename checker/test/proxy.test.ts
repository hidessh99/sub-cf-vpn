import { expect, test, describe, beforeEach } from "bun:test";
import { ProxyUseCase } from "../src/usecases/ProxyUseCase";
import { MockProxyRepository, MockGeoIPService } from "./mocks";
import { ValidationError, NotFoundError } from "../src/utils/errors";

describe("ProxyUseCase", () => {
  let proxyRepo: MockProxyRepository;
  let proxyUseCase: ProxyUseCase;

  beforeEach(() => {
    proxyRepo = new MockProxyRepository();
    const geoIPService = new MockGeoIPService();
    proxyUseCase = new ProxyUseCase(proxyRepo, geoIPService);
  });

  describe("createProxy", () => {
    test("should successfully create a proxy", () => {
      const result = proxyUseCase.createProxy({
        ip: "10.0.0.1",
        proxy: "test-proxy",
        port: "8080",
        proxyip: true,
        latency: 50,
        country: "ID",
        as_organization: "Telkom"
      });

      expect(result.id).toBe(1);
      expect(result.ip).toBe("10.0.0.1");
      expect(result.proxy).toBe("test-proxy");
      expect(result.port).toBe("8080");
      expect(result.country).toBe("ID");
      expect(result.as_organization).toBe("Telkom");
      expect(proxyRepo.count()).toBe(1);
    });

    test("should throw ValidationError if IP is missing", () => {
      expect(() => {
        proxyUseCase.createProxy({ ip: "", port: "443" });
      }).toThrow(new ValidationError("IP field is required"));
    });
  });

  describe("getAllProxies", () => {
    beforeEach(() => {
      proxyUseCase.createProxy({ ip: "1.1.1.1", port: "443", country: "US", is_active: true });
      proxyUseCase.createProxy({ ip: "2.2.2.2", port: "80", country: "ID", is_active: false });
      proxyUseCase.createProxy({ ip: "3.3.3.3", port: "443", country: "SG", is_active: true });
    });

    test("should paginate proxies correctly", () => {
      const page1 = proxyUseCase.getAllProxies(1, 2);
      expect(page1.total).toBe(3);
      expect(page1.data.length).toBe(2);

      const page2 = proxyUseCase.getAllProxies(2, 2);
      expect(page2.total).toBe(3);
      expect(page2.data.length).toBe(1);
    });

    test("should filter proxies by active status", () => {
      const active = proxyUseCase.getAllProxies(1, 10, { is_active: true });
      expect(active.total).toBe(2);
      expect(active.data.every(p => p.is_active)).toBe(true);

      const inactive = proxyUseCase.getAllProxies(1, 10, { is_active: false });
      expect(inactive.total).toBe(1);
      expect(inactive.data[0].ip).toBe("2.2.2.2");
    });

    test("should filter proxies by country", () => {
      const filtered = proxyUseCase.getAllProxies(1, 10, { country: "ID" });
      expect(filtered.total).toBe(1);
      expect(filtered.data[0].ip).toBe("2.2.2.2");
    });

    test("should search proxies by text query", () => {
      const searchRes = proxyUseCase.getAllProxies(1, 10, { search: "3.3.3" });
      expect(searchRes.total).toBe(1);
      expect(searchRes.data[0].country).toBe("SG");
    });
  });

  describe("updateProxy", () => {
    test("should successfully update an existing proxy", () => {
      const created = proxyUseCase.createProxy({ ip: "1.1.1.1", port: "443", latency: 100 });
      const updated = proxyUseCase.updateProxy(created.id, { latency: 50, is_active: false });

      expect(updated.latency).toBe(50);
      expect(updated.is_active).toBe(false);
      expect(updated.ip).toBe("1.1.1.1"); // should remain unchanged
    });

    test("should throw NotFoundError if proxy to update does not exist", () => {
      expect(() => {
        proxyUseCase.updateProxy(999, { latency: 50 });
      }).toThrow(new NotFoundError("Proxy not found"));
    });
  });

  describe("deleteProxy", () => {
    test("should successfully delete an existing proxy", () => {
      const created = proxyUseCase.createProxy({ ip: "1.1.1.1", port: "443" });
      expect(proxyRepo.count()).toBe(1);

      proxyUseCase.deleteProxy(created.id);
      expect(proxyRepo.count()).toBe(0);
    });

    test("should throw NotFoundError if proxy to delete does not exist", () => {
      expect(() => {
        proxyUseCase.deleteProxy(999);
      }).toThrow(new NotFoundError("Proxy not found"));
    });
  });

  describe("importFromJSON", () => {
    test("should successfully bulk import proxies", () => {
      const importCount = proxyUseCase.importFromJSON([
        { ip: "8.8.8.8", port: "443", country: "US" },
        { ip: "9.9.9.9", port: "80", country: "CH" }
      ]);

      expect(importCount).toBe(2);
      expect(proxyRepo.count()).toBe(2);
    });

    test("should throw ValidationError if bulk import data is not array", () => {
      expect(() => {
        proxyUseCase.importFromJSON({} as any);
      }).toThrow(new ValidationError("Import data must be a JSON array"));
    });

    test("should throw ValidationError if any imported item is missing IP", () => {
      expect(() => {
        proxyUseCase.importFromJSON([
          { ip: "8.8.8.8", port: "443" },
          { ip: "", port: "80" }
        ]);
      }).toThrow(new ValidationError("Missing required field 'ip' in import items"));
    });
  });

  describe("getPublicProxyList & getPublicProxyListGrouped", () => {
    beforeEach(() => {
      proxyUseCase.createProxy({ ip: "1.1.1.1", proxy: "proxy1", port: "443", country: "US", is_active: true });
      proxyUseCase.createProxy({ ip: "2.2.2.2", proxy: "proxy2", port: "80", country: "ID", is_active: false });
      proxyUseCase.createProxy({ ip: "3.3.3.3", proxy: "proxy3", port: "443", country: "US", is_active: true });
    });

    test("should only return active proxies in public list", () => {
      const publicList = proxyUseCase.getPublicProxyList();
      expect(publicList.length).toBe(2);
      expect(publicList.map(p => p.ip)).toContain("1.1.1.1");
      expect(publicList.map(p => p.ip)).toContain("3.3.3.3");
      expect(publicList.map(p => p.ip)).not.toContain("2.2.2.2");
    });

    test("should group active proxies by country properly", () => {
      const grouped = proxyUseCase.getPublicProxyListGrouped();
      expect(grouped["US"]).toBeDefined();
      expect(grouped["US"].length).toBe(2);
      expect(grouped["US"]).toContain("proxy1:443");
      expect(grouped["US"]).toContain("proxy3:443");
      expect(grouped["ID"]).toBeUndefined(); // Since ID was inactive
    });
  });
});
