import { BugRepository } from "../repositories/BugRepository";
import { Bug } from "../models/Bug";

export class BugUseCase {
  private bugRepo = new BugRepository();

  getAllBugs(): Bug[] {
    return this.bugRepo.findAll();
  }

  createBug(hostname: string): Bug {
    if (!hostname) throw new Error("Hostname is required");
    const cleanHostname = hostname.trim().toLowerCase();

    // Check duplication
    const existing = this.bugRepo.findByHostname(cleanHostname);
    if (existing) {
      throw new Error(`Bug hostname '${cleanHostname}' already exists`);
    }

    return this.bugRepo.create(cleanHostname);
  }

  deleteBug(id: number): void {
    this.bugRepo.delete(id);
  }

  getPublicBugList(): string[] {
    return this.bugRepo.getPublicList();
  }
}
