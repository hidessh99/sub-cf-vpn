import { sign, verify } from "hono/jwt";

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 86400; // default 24h in seconds
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 86400;
  }
}

export async function signToken(payload: Record<string, any>, secret: string, expiresIn: string = "24h"): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + parseDuration(expiresIn);
  return sign({ ...payload, iat: now, exp }, secret);
}

export async function verifyToken(token: string, secret: string): Promise<Record<string, any>> {
  try {
    return await verify(token, secret, "HS256");
  } catch (e) {
    throw new Error("Invalid token");
  }
}
