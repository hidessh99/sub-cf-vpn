import { IBugRepository } from "../repositories/interfaces";
import { Bug } from "../models/Bug";
import { ValidationError } from "../utils/errors";
import { logger } from "../utils/logger";

export class BugUseCase {
  constructor(private bugRepo: IBugRepository) {}

  async getAllBugs(): Promise<Bug[]> {
    return await this.bugRepo.findAll();
  }

  async createBug(hostname: string): Promise<Bug> {
    if (!hostname) throw new ValidationError("Hostname is required");
    const cleanHostname = hostname.trim().toLowerCase();

    // Check duplication
    const existing = await this.bugRepo.findByHostname(cleanHostname);
    if (existing) {
      logger.warn(`Create bug failed - duplicate: ${cleanHostname}`, "BugUseCase");
      throw new ValidationError(`Bug hostname '${cleanHostname}' already exists`);
    }

    return await this.bugRepo.create(cleanHostname);
  }

  async deleteBug(id: number): Promise<void> {
    await this.bugRepo.delete(id);
  }

  async getPublicBugList(): Promise<string[]> {
    return await this.bugRepo.getPublicList();
  }

  async importFromJSON(list: string[]): Promise<number> {
    if (!Array.isArray(list)) {
      throw new ValidationError("Import data must be a JSON array of strings");
    }
    const count = await this.bugRepo.bulkCreate(list);
    return count;
  }
}
