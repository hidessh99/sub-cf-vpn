import { verifyToken } from "../utils/jwt";

export interface AuthContext {
  id: number;
  username: string;
}

export async function authenticateRequest(request: Request): Promise<AuthContext | null> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);
    if (!decoded.id || !decoded.username) {
      return null;
    }
    return {
      id: Number(decoded.id),
      username: String(decoded.username),
    };
  } catch (e) {
    return null;
  }
}
export type { AuthContext as AuthenticatedAdmin };
