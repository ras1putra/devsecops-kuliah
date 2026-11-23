import type { Sale, SaleStatus } from "./dashboard-data";

export type SalesDataSource = "demo" | "mysql";

export type SalesProviders<T> = {
  demo: () => T | Promise<T>;
  mysql: () => T | Promise<T>;
};

const INVALID_ROW_MESSAGE = "Invalid sales row returned by MySQL";
const DATABASE_URL_ERROR =
  "DATABASE_URL must be a valid MySQL URL for the classicmodels database";

export function parseDataSource(value: string | undefined): SalesDataSource {
  const source = value?.trim() || "demo";
  if (source === "demo" || source === "mysql") {
    return source;
  }

  throw new Error("DATA_SOURCE must be either demo or mysql");
}

export function validateDatabaseUrl(value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error("DATABASE_URL is required when DATA_SOURCE=mysql");
  }

  let url: URL;
  try {
    url = new URL(value.trim());
    decodeURIComponent(url.username);
    decodeURIComponent(url.password);
  } catch {
    throw new Error(DATABASE_URL_ERROR);
  }

  if (
    url.protocol !== "mysql:" ||
    !url.hostname ||
    url.pathname !== "/classicmodels"
  ) {
    throw new Error(DATABASE_URL_ERROR);
  }

  return value.trim();
}

export function readSalesForSource<T>(
  source: SalesDataSource,
  providers: SalesProviders<T>,
): T | Promise<T> {
  return source === "demo" ? providers.demo() : providers.mysql();
}

export function mapMySqlSale(row: unknown): Sale {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    throw new Error(INVALID_ROW_MESSAGE);
  }

  const value = row as Record<string, unknown>;
  const { id, customer, product, date, amount, rawStatus, channel } = value;

  if (
    typeof id !== "string" ||
    !id ||
    typeof customer !== "string" ||
    !customer ||
    typeof product !== "string" ||
    !product ||
    typeof channel !== "string" ||
    !channel ||
    typeof date !== "string" ||
    !isIsoDate(date) ||
    typeof rawStatus !== "string" ||
    !rawStatus
  ) {
    throw new Error(INVALID_ROW_MESSAGE);
  }

  const numericAmount = parseAmount(amount);
  if (numericAmount === undefined) {
    throw new Error(INVALID_ROW_MESSAGE);
  }

  return {
    id,
    customer,
    product,
    date,
    amount: numericAmount,
    status: mapStatus(rawStatus),
    channel,
  };
}

function parseAmount(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER
      ? value
      : undefined;
  }

  if (typeof value !== "string" || !/^(0|[1-9]\d*)(\.\d+)?$/.test(value)) {
    return undefined;
  }

  const amount = Number(value);
  return Number.isFinite(amount) && amount <= Number.MAX_SAFE_INTEGER
    ? amount
    : undefined;
}

function mapStatus(rawStatus: string): SaleStatus {
  if (rawStatus === "Shipped" || rawStatus === "Resolved") {
    return "completed";
  }

  if (rawStatus === "Cancelled") {
    return "cancelled";
  }

  return "processing";
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
