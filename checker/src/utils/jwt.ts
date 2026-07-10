import { SignJWT, jwtVerify } from "jose";
import { config } from "./config";

const JWT_SECRET = config.jwt.secret;
const secret = new TextEncoder().encode(JWT_SECRET);

export async function signToken(payload: Record<string, any>, expiresIn: string = config.jwt.expiresIn): Promise<string> {
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
