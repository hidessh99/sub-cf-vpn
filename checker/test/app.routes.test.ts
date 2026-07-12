import { expect, test, describe } from "bun:test";
import { app } from "../src/app";

describe("Hono App Routing Integration", () => {
  test("GET /health should return 200 and status ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toEqual({
      status: "ok",
      service: "lufeng-vpn-checker",
      runtime: "bun"
    });
  });

  test("GET / should return 200 and status ok", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.status).toBe("ok");
  });

  test("GET /api/v1/unknown-route should return 404", async () => {
    const res = await app.request("/api/v1/unknown-route");
    expect(res.status).toBe(404);
    const body = await res.json() as any;
    expect(body.success).toBe(false);
    expect(body.message).toContain("Route not found");
  });

  test("POST /api/v1/auth/login with invalid data should return 400 validation error", async () => {
    const res = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.success).toBe(false);
    expect(body.message).toContain("Validation failed");
    expect(body.errors).toContain("username: Username is required");
    expect(body.errors).toContain("password: Password is required");
  });

  test("GET /api/v1/auth/me without authorization should return 401", async () => {
    const res = await app.request("/api/v1/auth/me");
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.success).toBe(false);
    expect(body.message).toBe("Unauthorized");
  });

  describe("Proxy Import Integration Test", () => {
    test("POST /api/v1/proxies/import should succeed with frontend format { proxies: [...] }", async () => {
      const { signToken } = await import("../src/utils/jwt");
      const token = await signToken({ id: 1, username: "admin" });

      const res = await app.request("/api/v1/proxies/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          proxies: [
            { ip: "8.8.8.8", port: "53", proxy: "8.8.8.8", is_active: true }
          ]
        })
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.imported).toBe(1);
    });

    test("POST /api/v1/proxies/import should fail with old format [...]", async () => {
      const { signToken } = await import("../src/utils/jwt");
      const token = await signToken({ id: 1, username: "admin" });

      const res = await app.request("/api/v1/proxies/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify([
          { ip: "8.8.8.8", port: "53", proxy: "8.8.8.8", is_active: true }
        ])
      });

      expect(res.status).toBe(400);
      const body = await res.json() as any;
      expect(body.success).toBe(false);
      expect(body.message).toContain("Invalid import format");
      expect(body.errors).toContain("input: Expected object, received array");
    });
  });
});
