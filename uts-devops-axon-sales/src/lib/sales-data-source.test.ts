import { describe, expect, it, vi } from "vitest";
import {
  mapMySqlSale,
  parseDataSource,
  readSalesForSource,
  validateDatabaseUrl,
  type SalesDataSource,
} from "./sales-data-source";

describe("parseDataSource", () => {
  it("defaults an unset source to the runnable demo", () => {
    expect(parseDataSource(undefined)).toBe("demo");
  });

  it("accepts the two explicit source modes", () => {
    expect(parseDataSource("demo")).toBe("demo");
    expect(parseDataSource("mysql")).toBe("mysql");
  });

  it("rejects unknown modes without echoing their value", () => {
    expect(() => parseDataSource("postgres://user:password@host/db")).toThrow(
      "DATA_SOURCE must be either demo or mysql",
    );
  });
});

describe("validateDatabaseUrl", () => {
  it("accepts a MySQL URL without revealing it in errors", () => {
    const databaseUrl = "mysql://axon:secret@localhost:3306/classicmodels";
    expect(validateDatabaseUrl(databaseUrl)).toBe(databaseUrl);
  });

  it("rejects missing, malformed, and non-MySQL URLs", () => {
    expect(() => validateDatabaseUrl(undefined)).toThrow(
      "DATABASE_URL is required when DATA_SOURCE=mysql",
    );
    expect(() => validateDatabaseUrl("not a URL with password=secret")).toThrow(
      "DATABASE_URL must be a valid MySQL URL for the classicmodels database",
    );
    expect(() => validateDatabaseUrl("https://user:secret@example.test/db")).toThrow(
      "DATABASE_URL must be a valid MySQL URL for the classicmodels database",
    );
    expect(() => validateDatabaseUrl("mysql://user:secret@localhost/other_db")).toThrow(
      "DATABASE_URL must be a valid MySQL URL for the classicmodels database",
    );
  });
});

describe("mapMySqlSale", () => {
  it("maps one aggregated classicmodels order without rounding its decimal amount", () => {
    expect(
      mapMySqlSale({
        id: "10100",
        customer: "Online Diecast Creations Co.",
        product: "1940s Ford truck, 1911 Ford Town Car",
        date: "2003-01-06",
        amount: "1250.37",
        rawStatus: "Shipped",
        channel: "USA",
      }),
    ).toEqual({
      id: "10100",
      customer: "Online Diecast Creations Co.",
      product: "1940s Ford truck, 1911 Ford Town Car",
      date: "2003-01-06",
      amount: 1250.37,
      status: "completed",
      channel: "USA",
    });
  });

  it.each([
    ["Resolved", "completed"],
    ["Cancelled", "cancelled"],
    ["On Hold", "processing"],
    ["In Process", "processing"],
  ] as const)("maps source status %s to %s", (rawStatus, status) => {
    expect(
      mapMySqlSale({
        id: "10100",
        customer: "Online Diecast Creations Co.",
        product: "Classic car",
        date: "2003-01-06",
        amount: "10.25",
        rawStatus,
        channel: "USA",
      }).status,
    ).toBe(status);
  });

  it("rejects malformed and unsafe decimal amounts", () => {
    for (const amount of ["9007199254740992", "not-a-number", "-10.25", "1.25 USD"]) {
      expect(() =>
        mapMySqlSale({
          id: "10100",
          customer: "Online Diecast Creations Co.",
          product: "Classic car",
          date: "2003-01-06",
          amount,
          rawStatus: "Shipped",
          channel: "USA",
        }),
      ).toThrow("Invalid sales row returned by MySQL");
    }
  });

  it("rejects malformed dates and fields", () => {
    const sale = {
      id: "10100",
      customer: "Online Diecast Creations Co.",
      product: "Classic car",
      date: "2026-02-30",
      amount: "10.25",
      rawStatus: "Shipped",
      channel: "USA",
    };

    expect(() => mapMySqlSale(sale)).toThrow("Invalid sales row returned by MySQL");
    expect(() =>
      mapMySqlSale({ ...sale, date: "2003-01-06", customer: "" }),
    ).toThrow("Invalid sales row returned by MySQL");
  });
});

describe("readSalesForSource", () => {
  it("reads demo fixtures only when demo mode is selected", async () => {
    const demo = vi.fn(async () => ["demo"]);
    const mysql = vi.fn(async () => ["database"]);

    await expect(
      readSalesForSource("demo", { demo, mysql } satisfies Record<SalesDataSource, () => Promise<string[]>>),
    ).resolves.toEqual(["demo"]);
    expect(demo).toHaveBeenCalledOnce();
    expect(mysql).not.toHaveBeenCalled();
  });

  it("does not silently fall back to demo when MySQL fails", async () => {
    const demo = vi.fn(async () => ["demo"]);
    const mysql = vi.fn(async () => {
      throw new Error("database password must not be returned");
    });

    await expect(
      readSalesForSource("mysql", { demo, mysql } satisfies Record<SalesDataSource, () => Promise<string[]>>),
    ).rejects.toThrow("database password must not be returned");
    expect(demo).not.toHaveBeenCalled();
  });
});
