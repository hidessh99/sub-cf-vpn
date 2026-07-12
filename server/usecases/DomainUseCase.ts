import { IDomainRepository } from "../repositories/interfaces";
import { Domain } from "../models/Domain";
import { ValidationError } from "../utils/errors";
import { logger } from "../utils/logger";

export class DomainUseCase {
  constructor(private domainRepo: IDomainRepository) {}

  async getAllDomains(): Promise<Domain[]> {
    return await this.domainRepo.findAll();
  }

  async createDomain(domainName: string): Promise<Domain> {
    if (!domainName) throw new ValidationError("Domain name is required");
    const cleanDomain = domainName.trim().toLowerCase();
    
    // Check duplication
    const existing = await this.domainRepo.findByDomain(cleanDomain);
    if (existing) {
      logger.warn(`Create domain failed - duplicate: ${cleanDomain}`, "DomainUseCase");
      throw new ValidationError(`Domain '${cleanDomain}' already exists`);
    }

    return await this.domainRepo.create(cleanDomain);
  }

  async deleteDomain(id: number): Promise<void> {
    await this.domainRepo.delete(id);
  }

  async getPublicDomainList(): Promise<string[]> {
    return await this.domainRepo.getPublicList();
  }

  async importFromJSON(list: string[]): Promise<number> {
    if (!Array.isArray(list)) {
      throw new ValidationError("Import data must be a JSON array of strings");
    }
    const count = await this.domainRepo.bulkCreate(list);
    return count;
  }
}
