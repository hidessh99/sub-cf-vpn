import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-this-in-production-12345678";
const secret = new TextEncoder().encode(JWT_SECRET);

export async function signToken(payload: Record<string, any>, expiresIn: string = "24h"): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<Record<string, any>> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (e) {
    throw new Error("Invalid token");
  }
}
