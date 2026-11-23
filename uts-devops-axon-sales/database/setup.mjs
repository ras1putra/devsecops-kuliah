import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createConnection } from "mysql2/promise";

function getLocalConnectionOptions(value) {
  let url;
  try {
    url = new URL(value ?? "");
    decodeURIComponent(url.username);
    decodeURIComponent(url.password);
  } catch {
    return undefined;
  }

  if (
    url.protocol !== "mysql:" ||
    !["localhost", "127.0.0.1", "[::1]", "::1"].includes(url.hostname) ||
    url.pathname !== "/classicmodels"
  ) {
    return undefined;
  }

  return {
    host: url.hostname.replace(/^\[|\]$/g, ""),
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: "classicmodels",
    connectTimeout: 3_000,
    decimalNumbers: false,
    multipleStatements: true,
  };
}

async function setup() {
  const options = getLocalConnectionOptions(process.env.DATABASE_URL);
  if (!options) {
    console.error(
      "db:setup requires DATABASE_URL to target a local MySQL /classicmodels database.",
    );
    process.exitCode = 1;
    return;
  }

  const dump = await readFile(
    fileURLToPath(new URL("./source/Axon sales - Mysql Database.sql", import.meta.url)),
    "utf8",
  );
  const connection = await createConnection(options);
  try {
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS object_count
       FROM information_schema.tables
       WHERE table_schema = ?`,
      ["classicmodels"],
    );
    const objectCount = Number(rows[0]?.object_count);
    if (objectCount !== 0) {
      console.error(
        `Refusing destructive dump import: classicmodels already contains ${objectCount} table(s)/view(s). No import was run.`,
      );
      process.exitCode = 1;
      return;
    }

    await connection.query(dump);
    console.log("Imported the instructor classicmodels dump into the empty local database.");
  } finally {
    await connection.end();
  }
}

try {
  await setup();
} catch {
  console.error("MySQL setup failed; connection details were not printed.");
  process.exitCode = 1;
}
