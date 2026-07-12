import { Context } from "hono";

export class SystemController {
  async healthCheck(c: Context): Promise<Response> {
    return c.json({
      status: "ok",
      service: "lufeng-vpn-checker",
      runtime: "bun"
    });
  }
}
