import { Context } from "hono";
import { IBugUseCase } from "../usecases/interfaces";
import { CreateBugRequest } from "../dto/bug.dto";
import { logger } from "../utils/logger";

export class BugController {
  constructor(private bugUseCase: IBugUseCase) {}

  async getBugs(c: Context): Promise<Response> {
    const list = this.bugUseCase.getAllBugs();
    return c.json({
      success: true,
      message: "Bugs retrieved successfully",
      data: list
    });
  }

  async createBug(c: Context): Promise<Response> {
    const { hostname } = c.req.valid("json" as never) as CreateBugRequest;
    const result = this.bugUseCase.createBug(hostname);
    return c.json({
      success: true,
      message: "Bug created successfully",
      data: result
    }, 201);
  }

  async deleteBug(c: Context): Promise<Response> {
    const id = parseInt(c.req.param("id") || "", 10);
    if (isNaN(id)) {
      logger.warn(`deleteBug failed - invalid ID: ${c.req.param("id")}`, "BugController");
      return c.json({ success: false, message: "Invalid ID parameter", error: null }, 400);
    }
    this.bugUseCase.deleteBug(id);
    return c.json({
      success: true,
      message: "Bug deleted successfully",
      data: null
    });
  }

  async getPublicBugs(c: Context): Promise<Response> {
    const list = this.bugUseCase.getPublicBugList();
    return c.json(list);
  }

  async importBugs(c: Context): Promise<Response> {
    const data = c.req.valid("json" as never) as string[];
    const count = this.bugUseCase.importFromJSON(data);
    return c.json({
      success: true,
      message: `Successfully imported ${count} bug hostnames`,
      data: { imported: count }
    });
  }
}
