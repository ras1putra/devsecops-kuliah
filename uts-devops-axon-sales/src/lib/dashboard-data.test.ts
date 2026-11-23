import { describe, expect, it } from "vitest";
import {
  filterSales,
  formatSaleAmount,
  formatSalesAxisTick,
  getSalesAxisMaximum,
  getSalesSourcePresentation,
  getDashboardSummary,
  getSalesTrend,
  type Sale,
} from "./dashboard-data";

const sales: Sale[] = [
  {
    id: "AX-1001",
    customer: "Alya Putri",
    product: "Starter Kit",
    date: "2026-10-03",
    amount: 450_000,
    status: "completed",
    channel: "Website",
  },
  {
    id: "AX-1002",
    customer: "Bima Pratama",
    product: "Growth Plan",
    date: "2026-10-04",
    amount: 1_200_000,
    status: "processing",
    channel: "WhatsApp",
  },
  {
    id: "AX-1003",
    customer: "Alya Putri",
    product: "Growth Plan",
    date: "2026-10-04",
    amount: 800_000,
    status: "cancelled",
    channel: "Instagram",
  },
  {
    id: "AX-1004",
    customer: "Citra Lestari",
    product: "Starter Kit",
    date: "2026-10-05",
    amount: 525_000,
    status: "completed",
    channel: "Website",
  },
];

describe("filterSales", () => {
  it("keeps the full historical dataset when no date range is selected", () => {
    expect(filterSales(sales).map(({ id }) => id)).toEqual([
      "AX-1004",
      "AX-1002",
      "AX-1003",
      "AX-1001",
    ]);
  });

  it("combines search, inclusive dates, and status instead of applying only one filter", () => {
    expect(
      filterSales(sales, {
        query: "growth",
        from: "2026-10-04",
        to: "2026-10-04",
        status: "processing",
      }).map(({ id }) => id),
    ).toEqual(["AX-1002"]);
  });

  it("returns no results for a reversed date range", () => {
    expect(
      filterSales(sales, { from: "2026-10-05", to: "2026-10-03" }),
    ).toEqual([]);
  });

  it("searches across customer, product, and order ID without case sensitivity", () => {
    expect(filterSales(sales, { query: "  ax-1004 ", status: "all" })).toEqual([
      sales[3],
    ]);
    expect(filterSales(sales, { query: "ALYA", status: "all" })).toEqual([
      sales[2],
      sales[0],
    ]);
  });

  it("returns transactions in newest-first order", () => {
    expect(filterSales(sales, { status: "all" }).map(({ id }) => id)).toEqual([
      "AX-1004",
      "AX-1002",
      "AX-1003",
      "AX-1001",
    ]);
  });
});

describe("dashboard source presentation", () => {
  it("identifies the lecturer MySQL dataset and its country and neutral value fields", () => {
    expect(getSalesSourcePresentation("mysql")).toEqual({
      label: "MySQL · Data dosen",
      locationLabel: "Negara pelanggan",
      amountUnitLabel: "Nilai dataset · desimal",
      tableAmountLabel: "Nilai",
      revenueMetricTitle: "Nilai transaksi aktif",
      averageMetricTitle: "Rata-rata nilai aktif",
      footerLabel: "Dashboard Axon Sales · Nilai dataset tanpa satuan mata uang",
    });
  });

  it("formats MySQL amounts as decimals without assuming a currency and keeps demo in IDR", () => {
    expect(formatSaleAmount(12_345.6, "mysql")).toBe("12.345,60");
    expect(formatSaleAmount(1_250_000, "demo")).toBe("Rp\u00a01.250.000");
  });

  it("uses neutral decimal chart ticks for MySQL and rupiah-scaled ticks for demo", () => {
    expect(formatSalesAxisTick(12_345.6, "mysql")).toBe("12.345,60");
    expect(formatSalesAxisTick(1_250_000, "demo")).toBe("1,3 jt");
    expect(getSalesAxisMaximum(12_345.6, "mysql")).toBe(20_000);
    expect(getSalesAxisMaximum(1_250_000, "demo")).toBe(2_000_000);
  });
});

describe("getDashboardSummary", () => {
  it("excludes cancelled revenue and derives averages and completion rate from active orders", () => {
    expect(getDashboardSummary(sales)).toEqual({
      totalRevenue: 2_175_000,
      transactionCount: 4,
      activeTransactionCount: 3,
      averageOrderValue: 725_000,
      completedCount: 2,
      completionRate: 2 / 3,
    });
  });

  it("returns safe zero values when the filtered set is empty", () => {
    expect(getDashboardSummary([])).toEqual({
      totalRevenue: 0,
      transactionCount: 0,
      activeTransactionCount: 0,
      averageOrderValue: 0,
      completedCount: 0,
      completionRate: 0,
    });
  });

  it("keeps fractional order values in revenue and average calculations", () => {
    expect(
      getDashboardSummary([
        { ...sales[0], amount: 12.35 },
        { ...sales[1], amount: 0.4 },
        { ...sales[2], amount: 5.99 },
      ]),
    ).toEqual({
      totalRevenue: 12.75,
      transactionCount: 3,
      activeTransactionCount: 2,
      averageOrderValue: 6.375,
      completedCount: 1,
      completionRate: 0.5,
    });
  });
});

describe("getSalesTrend", () => {
  it("groups filtered revenue by date and keeps cancelled-only days at zero", () => {
    expect(
      getSalesTrend([
        sales[0],
        sales[1],
        sales[2],
        { ...sales[2], id: "AX-1005", date: "2026-10-06" },
      ]),
    ).toEqual([
      { date: "2026-10-03", revenue: 450_000, transactions: 1 },
      { date: "2026-10-04", revenue: 1_200_000, transactions: 1 },
      { date: "2026-10-06", revenue: 0, transactions: 0 },
    ]);
  });

  it("returns no chart points for an empty result", () => {
    expect(getSalesTrend([])).toEqual([]);
  });
});
