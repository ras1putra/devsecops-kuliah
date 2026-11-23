import "server-only";
import { createPool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

export interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: "admin" | "user";
}

export async function createUser(
  email: string,
  passwordHash: string,
  name: string,
): Promise<number> {
  const pool = createPool({ uri: process.env.DATABASE_URL, connectionLimit: 2 });
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
      [email, passwordHash, name],
    );
    return result.insertId;
  } finally {
    await pool.end();
  }
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const pool = createPool({ uri: process.env.DATABASE_URL, connectionLimit: 2 });
  try {
    const [rows] = await pool.execute<UserRow[]>(
      "SELECT id, email, password_hash, name, role FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    return rows[0] ?? null;
  } finally {
    await pool.end();
  }
}
