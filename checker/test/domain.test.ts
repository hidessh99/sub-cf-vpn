import { expect, test, describe, beforeEach } from "bun:test";
import { DomainUseCase } from "../src/usecases/DomainUseCase";
import { MockDomainRepository } from "./mocks";
import { ValidationError } from "../src/utils/errors";

describe("DomainUseCase", () => {
  let domainRepo: MockDomainRepository;
  let domainUseCase: DomainUseCase;

  beforeEach(() => {
    domainRepo = new MockDomainRepository();
    domainUseCase = new DomainUseCase(domainRepo);
  });

  describe("createDomain", () => {
    test("should successfully create a domain", () => {
      const result = domainUseCase.createDomain("google.com");
      expect(result.id).toBe(1);
      expect(result.domain).toBe("google.com");
      expect(domainRepo.count()).toBe(1);
    });

    test("should trim and lowercase domain names", () => {
      const result = domainUseCase.createDomain("  CF-vPN.Net  ");
      expect(result.domain).toBe("cf-vpn.net");
    });

    test("should throw ValidationError if domain input is empty", () => {
      expect(() => {
        domainUseCase.createDomain("");
      }).toThrow(new ValidationError("Domain name is required"));
    });

    test("should throw ValidationError if domain already exists", () => {
      domainUseCase.createDomain("cloudflare.com");
      expect(() => {
        domainUseCase.createDomain("cloudflare.com");
      }).toThrow(new ValidationError("Domain 'cloudflare.com' already exists"));
    });
  });

  describe("getAllDomains", () => {
    test("should list all domains in descending ID order", () => {
      domainUseCase.createDomain("domain1.com");
      domainUseCase.createDomain("domain2.com");

      const list = domainUseCase.getAllDomains();
      expect(list.length).toBe(2);
      expect(list[0].domain).toBe("domain2.com");
      expect(list[1].domain).toBe("domain1.com");
    });
  });

  describe("deleteDomain", () => {
    test("should successfully delete a domain", () => {
      const created = domainUseCase.createDomain("todelete.com");
      expect(domainRepo.count()).toBe(1);

      domainUseCase.deleteDomain(created.id);
      expect(domainRepo.count()).toBe(0);
    });
  });

  describe("importFromJSON", () => {
    test("should successfully bulk import domains", () => {
      const count = domainUseCase.importFromJSON(["abc.com", "xyz.net", "  ABC.COM  "]);
      // Unique domains imported (the last duplicate should be ignored)
      expect(count).toBe(2);
      expect(domainRepo.count()).toBe(2);
      expect(domainRepo.db.map(d => d.domain)).toContain("abc.com");
      expect(domainRepo.db.map(d => d.domain)).toContain("xyz.net");
    });

    test("should throw ValidationError if import input is not array", () => {
      expect(() => {
        domainUseCase.importFromJSON({} as any);
      }).toThrow(new ValidationError("Import data must be a JSON array of strings"));
    });
  });

  describe("getPublicDomainList", () => {
    test("should return list of raw domain strings", () => {
      domainUseCase.createDomain("one.com");
      domainUseCase.createDomain("two.net");

      const list = domainUseCase.getPublicDomainList();
      expect(list).toEqual(["one.com", "two.net"]);
    });
  });
});
