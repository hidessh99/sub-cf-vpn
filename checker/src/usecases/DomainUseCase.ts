import { DomainRepository } from "../repositories/DomainRepository";
import { Domain } from "../models/Domain";

export class DomainUseCase {
  private domainRepo = new DomainRepository();

  getAllDomains(): Domain[] {
    return this.domainRepo.findAll();
  }

  createDomain(domainName: string): Domain {
    if (!domainName) throw new Error("Domain name is required");
    const cleanDomain = domainName.trim().toLowerCase();
    
    // Check duplication
    const existing = this.domainRepo.findByDomain(cleanDomain);
    if (existing) {
      throw new Error(`Domain '${cleanDomain}' already exists`);
    }

    return this.domainRepo.create(cleanDomain);
  }

  deleteDomain(id: number): void {
    this.domainRepo.delete(id);
  }

  getPublicDomainList(): string[] {
    return this.domainRepo.getPublicList();
  }

  importFromJSON(list: string[]): number {
    if (!Array.isArray(list)) {
      throw new Error("Import data must be a JSON array of strings");
    }
    return this.domainRepo.bulkCreate(list);
  }
}
