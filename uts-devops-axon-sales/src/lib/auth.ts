import "server-only";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: "admin" | "user";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    return {
      id: Number(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
      role: (payload.role as "admin" | "user") ?? "user",
    };
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export function getAuthUser(request: Request): AuthUser | null {
  const token = extractTokenFromHeader(request.headers.get("authorization"));
  if (!token) return null;
  return verifyToken(token);
}
