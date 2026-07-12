import { IDomainRepository } from "../repositories/interfaces";
import { Domain } from "../models/Domain";
import { ValidationError } from "../utils/errors";
import { logger } from "../utils/logger";

export class DomainUseCase {
  constructor(private domainRepo: IDomainRepository) {}

  getAllDomains(): Domain[] {
    return this.domainRepo.findAll();
  }

  createDomain(domainName: string): Domain {
    if (!domainName) throw new ValidationError("Domain name is required");
    const cleanDomain = domainName.trim().toLowerCase();
    
    // Check duplication
    const existing = this.domainRepo.findByDomain(cleanDomain);
    if (existing) {
      logger.warn(`Create domain failed - duplicate: ${cleanDomain}`, "DomainUseCase");
      throw new ValidationError(`Domain '${cleanDomain}' already exists`);
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
      throw new ValidationError("Import data must be a JSON array of strings");
    }
    const count = this.domainRepo.bulkCreate(list);
    return count;
  }
}
