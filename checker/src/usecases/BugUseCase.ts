import { IBugRepository } from "../repositories/interfaces";
import { Bug } from "../models/Bug";
import { ValidationError } from "../utils/errors";
import { logger } from "../utils/logger";

export class BugUseCase {
  constructor(private bugRepo: IBugRepository) {}

  getAllBugs(): Bug[] {
    return this.bugRepo.findAll();
  }

  createBug(hostname: string): Bug {
    if (!hostname) throw new ValidationError("Hostname is required");
    const cleanHostname = hostname.trim().toLowerCase();

    // Check duplication
    const existing = this.bugRepo.findByHostname(cleanHostname);
    if (existing) {
      logger.warn(`Create bug failed - duplicate: ${cleanHostname}`, "BugUseCase");
      throw new ValidationError(`Bug hostname '${cleanHostname}' already exists`);
    }

    return this.bugRepo.create(cleanHostname);
  }

  deleteBug(id: number): void {
    this.bugRepo.delete(id);
  }

  getPublicBugList(): string[] {
    return this.bugRepo.getPublicList();
  }

  importFromJSON(list: string[]): number {
    if (!Array.isArray(list)) {
      throw new ValidationError("Import data must be a JSON array of strings");
    }
    const count = this.bugRepo.bulkCreate(list);
    return count;
  }
}
