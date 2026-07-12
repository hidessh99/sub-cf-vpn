import { expect, test, describe, beforeEach } from "bun:test";
import { BugUseCase } from "../src/usecases/BugUseCase";
import { MockBugRepository } from "./mocks";
import { ValidationError } from "../src/utils/errors";

describe("BugUseCase", () => {
  let bugRepo: MockBugRepository;
  let bugUseCase: BugUseCase;

  beforeEach(() => {
    bugRepo = new MockBugRepository();
    bugUseCase = new BugUseCase(bugRepo);
  });

  describe("createBug", () => {
    test("should successfully create a bug host", () => {
      const result = bugUseCase.createBug("m.youtube.com");
      expect(result.id).toBe(1);
      expect(result.hostname).toBe("m.youtube.com");
      expect(bugRepo.count()).toBe(1);
    });

    test("should trim and lowercase bug hostnames", () => {
      const result = bugUseCase.createBug("  BUG-HOST.id  ");
      expect(result.hostname).toBe("bug-host.id");
    });

    test("should throw ValidationError if hostname is empty", () => {
      expect(() => {
        bugUseCase.createBug("");
      }).toThrow(new ValidationError("Hostname is required"));
    });

    test("should throw ValidationError if hostname already exists", () => {
      bugUseCase.createBug("bug.com");
      expect(() => {
        bugUseCase.createBug("bug.com");
      }).toThrow(new ValidationError("Bug hostname 'bug.com' already exists"));
    });
  });

  describe("getAllBugs", () => {
    test("should list all bugs in descending ID order", () => {
      bugUseCase.createBug("bug1.com");
      bugUseCase.createBug("bug2.com");

      const list = bugUseCase.getAllBugs();
      expect(list.length).toBe(2);
      expect(list[0].hostname).toBe("bug2.com");
      expect(list[1].hostname).toBe("bug1.com");
    });
  });

  describe("deleteBug", () => {
    test("should successfully delete a bug", () => {
      const created = bugUseCase.createBug("bugtodelete.com");
      expect(bugRepo.count()).toBe(1);

      bugUseCase.deleteBug(created.id);
      expect(bugRepo.count()).toBe(0);
    });
  });

  describe("importFromJSON", () => {
    test("should successfully bulk import bug hostnames", () => {
      const count = bugUseCase.importFromJSON(["bug1.com", "bug2.net", "  BUG1.COM  "]);
      // Unique bug hosts imported
      expect(count).toBe(2);
      expect(bugRepo.count()).toBe(2);
      expect(bugRepo.db.map(b => b.hostname)).toContain("bug1.com");
      expect(bugRepo.db.map(b => b.hostname)).toContain("bug2.net");
    });

    test("should throw ValidationError if import input is not array", () => {
      expect(() => {
        bugUseCase.importFromJSON({} as any);
      }).toThrow(new ValidationError("Import data must be a JSON array of strings"));
    });
  });

  describe("getPublicBugList", () => {
    test("should return list of raw bug hostname strings", () => {
      bugUseCase.createBug("line.me");
      bugUseCase.createBug("whatsapp.net");

      const list = bugUseCase.getPublicBugList();
      expect(list).toEqual(["line.me", "whatsapp.net"]);
    });
  });
});
