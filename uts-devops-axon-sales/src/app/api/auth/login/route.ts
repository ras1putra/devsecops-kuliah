import { NextResponse } from "next/server";
import { createPool } from "mysql2/promise";
import { signToken, verifyPassword } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LoginBody {
  email?: string;
  password?: string;
}

export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = await request.json();
  } catch {
    logger.warn("Login rejected: invalid JSON body", { action: "auth_login" });
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    logger.warn("Login rejected: missing email or password", { action: "auth_login" });
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    logger.error("Login failed: DATABASE_URL not configured", undefined, { action: "auth_login" });
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const pool = createPool({ uri: connectionString, connectionLimit: 2 });

  try {
    const [rows] = await pool.execute(
      "SELECT id, email, password_hash, name, role FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    const users = rows as Array<{
      id: number;
      email: string;
      password_hash: string;
      name: string;
      role: "admin" | "user";
    }>;

    if (users.length === 0) {
      logger.warn("Login failed: user not found", { action: "auth_login", email });
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const user = users[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      logger.warn("Login failed: incorrect password", { action: "auth_login", email });
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    logger.info("User login successful", {
      action: "auth_login",
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err: unknown) {
    logger.error("Login encountered database/internal error", err, {
      action: "auth_login",
      email,
    });
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  } finally {
    await pool.end();
  }
}
