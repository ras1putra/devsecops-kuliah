import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockCreatePool = vi.hoisted(() => vi.fn());
const mockPoolQuery = vi.hoisted(() => vi.fn());
const mockPoolOn = vi.hoisted(() => vi.fn());
const mockConnectionOn = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("mysql2/promise", () => ({
  createPool: mockCreatePool,
}));

import { getReadiness, getSalesData } from "./sales-repository";

describe("MySQL sales repository", () => {
  beforeEach(() => {
    Reflect.deleteProperty(globalThis, "axonSalesPool");
    vi.stubEnv("DATA_SOURCE", "mysql");
    vi.stubEnv("DATABASE_URL", "mysql://user:private-value@localhost:3306/classicmodels");
    mockPoolQuery.mockReset().mockResolvedValue([[], []]);
    mockPoolOn.mockReset();
    mockCreatePool.mockReset().mockReturnValue({
      query: mockPoolQuery,
      on: mockPoolOn,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    Reflect.deleteProperty(globalThis, "axonSalesPool");
  });

  it("returns one mapped Sale per aggregated order and does not round DECIMAL", async () => {
    mockPoolQuery.mockResolvedValueOnce([
      [
        {
          id: "10100",
          customer: "Online Diecast Creations Co.",
          product: "1940s Ford truck, 1911 Ford Town Car",
          date: "2003-01-06",
          amount: "1250.37",
          rawStatus: "Shipped",
          channel: "USA",
        },
      ],
      [],
    ]);

    const response = await getSalesData();

    expect(response).toEqual({
      source: "mysql",
      sales: [
        {
          id: "10100",
          customer: "Online Diecast Creations Co.",
          product: "1940s Ford truck, 1911 Ford Town Car",
          date: "2003-01-06",
          amount: 1250.37,
          status: "completed",
          channel: "USA",
        },
      ],
    });

    const query = mockPoolQuery.mock.calls[0]?.[0];
    expect(query.sql).toContain("SUM(od.quantityOrdered * od.priceEach)");
    expect(query.sql).toContain("GROUP_CONCAT");
    expect(query.sql).toContain("SET_VAR(group_concat_max_len=8192)");
    expect(query.sql).not.toMatch(/\bROUND\s*\(/i);
    expect(query.timeout).toBe(5_000);
    expect(mockCreatePool).toHaveBeenCalledWith(
      expect.objectContaining({
        uri: "mysql://user:private-value@localhost:3306/classicmodels",
        connectionLimit: 5,
        queueLimit: 10,
        connectTimeout: 3_000,
        decimalNumbers: false,
      }),
    );
  });

  it("checks the actual classicmodels tables for MySQL readiness", async () => {
    await expect(getReadiness()).resolves.toEqual({
      ready: true,
      source: "mysql",
      database: "connected",
    });
    expect(mockPoolQuery.mock.calls[0]?.[0].sql).toContain("classicmodels.orders");
    expect(mockPoolQuery.mock.calls[0]?.[0].timeout).toBe(3_000);
  });

  it("returns unavailable readiness after a bounded MySQL query failure", async () => {
    mockPoolQuery.mockRejectedValueOnce(new Error("server unavailable"));

    await expect(getReadiness()).resolves.toEqual({
      ready: false,
      source: "mysql",
      database: "unavailable",
    });
  });

  it("does not fall back to demo sales when the MySQL query fails", async () => {
    mockPoolQuery.mockRejectedValueOnce(new Error("query failure"));

    await expect(getSalesData()).rejects.toThrow("query failure");
  });

  it("handles idle-connection errors with a fixed message and no secret details", async () => {
    await expect(getSalesData()).resolves.toEqual({ source: "mysql", sales: [] });

    const connectionListener = mockPoolOn.mock.calls[0]?.[1];
    expect(connectionListener).toBeTypeOf("function");
    if (typeof connectionListener === "function") {
      connectionListener({ on: mockConnectionOn });
    }

    const errorListener = mockConnectionOn.mock.calls[0]?.[1];
    expect(errorListener).toBeTypeOf("function");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    if (typeof errorListener === "function") {
      errorListener(new Error("connection string leaked: private-value"), {
        id: "client-secret",
      });
    }

    expect(console.error).toHaveBeenCalledOnce();
    expect(console.error).toHaveBeenCalledWith(
      "Unexpected idle MySQL connection error; connection discarded.",
    );
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "private-value",
    );
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "client-secret",
    );
  });
});
