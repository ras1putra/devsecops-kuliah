import { NextResponse } from "next/server";
import { createPool } from "mysql2/promise";
import { hashPassword } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RegisterBody {
  email?: string;
  password?: string;
  name?: string;
}

export async function POST(request: Request) {
  let body: RegisterBody;
  try {
    body = await request.json();
  } catch {
    logger.warn("Registration rejected: invalid JSON body", { action: "auth_register" });
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const name = body.name?.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }
  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Name must be at least 2 characters" },
      { status: 400 },
    );
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    logger.error("Registration failed: DATABASE_URL not configured", undefined, { action: "auth_register" });
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const pool = createPool({ uri: connectionString, connectionLimit: 2 });

  try {
    const passwordHash = await hashPassword(password);
    const [result] = await pool.execute(
      "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
      [email, passwordHash, name],
    );
    const insertId = (result as { insertId: number }).insertId;

    logger.info("New user registered successfully", {
      action: "auth_register",
      userId: insertId,
      email,
      name,
    });

    return NextResponse.json(
      { user: { id: insertId, email, name, role: "user" } },
      { status: 201 },
    );
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code === "ER_DUP_ENTRY") {
      logger.warn("Registration rejected: email already registered", { action: "auth_register", email });
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }
    logger.error("Registration encountered database/internal error", error, {
      action: "auth_register",
      email,
    });
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  } finally {
    await pool.end();
  }
}
