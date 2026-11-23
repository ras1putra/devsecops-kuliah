import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";

const host = process.env.DB_HOST || "localhost";
const port = Number(process.env.DB_PORT || 3306);
const user = process.env.DB_USER || "root";
const password = process.env.DB_PASSWORD || "axon_password";
const database = process.env.DB_NAME || "classicmodels";

const sqlPath = path.resolve(process.cwd(), "database/init.sql");

async function waitAndConnect(retries = 15, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[db:init] Connecting to MySQL at ${host}:${port} as ${user} (attempt ${attempt}/${retries})...`);
      const connection = await mysql.createConnection({
        host,
        port,
        user,
        password,
        multipleStatements: true,
      });
      return connection;
    } catch (err) {
      if (attempt === retries) {
        throw err;
      }
      console.log(`[db:init] Waiting for MySQL to be ready... (${err.message})`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function initDb() {
  if (!fs.existsSync(sqlPath)) {
    console.error(`[db:init] Error: SQL file not found at ${sqlPath}`);
    process.exit(1);
  }

  const connection = await waitAndConnect();

  try {
    console.log(`[db:init] Ensuring database '${database}' exists...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;`
    );
    await connection.query(`USE \`${database}\`;`);

    // Check if database already has tables
    const [rows] = await connection.query("SHOW TABLES LIKE 'customers';");
    if (Array.isArray(rows) && rows.length > 0) {
      console.log(`[db:init] Database '${database}' is already initialized. Skipping SQL execution.`);
      return;
    }

    console.log(`[db:init] Executing SQL dump from ${sqlPath}...`);
    const sql = fs.readFileSync(sqlPath, "latin1");
    await connection.query(sql);

    console.log(`[db:init] Database '${database}' successfully initialized!`);
  } finally {
    await connection.end();
  }
}

initDb().catch((err) => {
  console.error("[db:init] Failed:", err.message);
  process.exit(1);
});
