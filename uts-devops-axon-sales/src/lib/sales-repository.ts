import "server-only";
import { createPool, type Pool, type RowDataPacket } from "mysql2/promise";
import { DEMO_SALES } from "./dashboard-data";
import {
  mapMySqlSale,
  parseDataSource,
  readSalesForSource,
  validateDatabaseUrl,
  type SalesDataSource,
} from "./sales-data-source";

interface DatabaseSaleRow extends RowDataPacket {
  id: string;
  customer: string;
  product: string;
  date: string;
  amount: string;
  rawStatus: string;
  channel: string;
}

type SalesResponse = {
  source: SalesDataSource;
  sales: typeof DEMO_SALES;
};

type Readiness =
  | { ready: true; source: "demo"; database: "not_required" }
  | { ready: true; source: "mysql"; database: "connected" }
  | { ready: false; source?: "mysql"; database: "misconfigured" | "unavailable" };

const SALES_QUERY = `
  SELECT /*+ SET_VAR(group_concat_max_len=8192) */
    CAST(o.orderNumber AS CHAR) AS id,
    c.customerName AS customer,
    GROUP_CONCAT(DISTINCT p.productName ORDER BY p.productName SEPARATOR ', ') AS product,
    DATE_FORMAT(o.orderDate, '%Y-%m-%d') AS date,
    SUM(od.quantityOrdered * od.priceEach) AS amount,
    o.status AS rawStatus,
    c.country AS channel
  FROM classicmodels.orders AS o
  INNER JOIN classicmodels.customers AS c
    ON c.customerNumber = o.customerNumber
  INNER JOIN classicmodels.orderdetails AS od
    ON od.orderNumber = o.orderNumber
  INNER JOIN classicmodels.products AS p
    ON p.productCode = od.productCode
  GROUP BY o.orderNumber, c.customerName, o.orderDate, o.status, c.country
  ORDER BY o.orderDate DESC, o.orderNumber ASC
`;

const QUERY_TIMEOUT_MS = 5_000;
const CONNECT_TIMEOUT_MS = 3_000;

const READINESS_QUERY = `
  SELECT 1
  FROM classicmodels.orders AS o
  INNER JOIN classicmodels.customers AS c
    ON c.customerNumber = o.customerNumber
  INNER JOIN classicmodels.orderdetails AS od
    ON od.orderNumber = o.orderNumber
  INNER JOIN classicmodels.products AS p
    ON p.productCode = od.productCode
  LIMIT 0
`;

const globalForPool = globalThis as typeof globalThis & {
  axonSalesPool?: Pool;
};

function getPool() {
  const connectionString = validateDatabaseUrl(process.env.DATABASE_URL);
  if (!globalForPool.axonSalesPool) {
    const pool = createPool({
      uri: connectionString,
      waitForConnections: true,
      connectionLimit: 5,
      maxIdle: 5,
      queueLimit: 10,
      connectTimeout: CONNECT_TIMEOUT_MS,
      idleTimeout: 30_000,
      decimalNumbers: false,
    });
    pool.on("connection", (connection) => {
      connection.on("error", () => {
        console.error("Unexpected idle MySQL connection error; connection discarded.");
      });
    });
    globalForPool.axonSalesPool = pool;
  }

  return globalForPool.axonSalesPool;
}

export function getSalesDataSource(): SalesDataSource | undefined {
  try {
    return parseDataSource(process.env.DATA_SOURCE);
  } catch {
    return undefined;
  }
}

export async function getSalesData(): Promise<SalesResponse> {
  const source = parseDataSource(process.env.DATA_SOURCE);
  const sales = await readSalesForSource(source, {
    demo: () => DEMO_SALES,
    mysql: async () => {
      const [rows] = await getPool().query<DatabaseSaleRow[]>({
        sql: SALES_QUERY,
        timeout: QUERY_TIMEOUT_MS,
      });
      return rows.map(mapMySqlSale);
    },
  });

  return { source, sales };
}

export async function getReadiness(): Promise<Readiness> {
  let source: SalesDataSource;
  try {
    source = parseDataSource(process.env.DATA_SOURCE);
  } catch {
    return { ready: false, database: "misconfigured" };
  }

  if (source === "demo") {
    return { ready: true, source, database: "not_required" };
  }

  try {
    validateDatabaseUrl(process.env.DATABASE_URL);
  } catch {
    return { ready: false, source, database: "misconfigured" };
  }

  try {
    await getPool().query({
      sql: READINESS_QUERY,
      timeout: CONNECT_TIMEOUT_MS,
    });
    return { ready: true, source, database: "connected" };
  } catch {
    return { ready: false, source, database: "unavailable" };
  }
}
