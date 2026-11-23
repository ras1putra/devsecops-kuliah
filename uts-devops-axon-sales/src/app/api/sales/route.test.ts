import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSalesData, getSalesDataSource } from "@/lib/sales-repository";
import { GET } from "./route";

vi.mock("@/lib/sales-repository", () => ({
  getSalesData: vi.fn(),
  getSalesDataSource: vi.fn(),
}));

const mockGetSalesData = vi.mocked(getSalesData);
const mockGetSalesDataSource = vi.mocked(getSalesDataSource);

describe("GET /api/sales", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns sales in the shared contract with the active source", async () => {
    const result = {
      source: "demo" as const,
      sales: [
        {
          id: "AX-2401",
          customer: "CV Sinar Nusantara",
          product: "Starter Kit",
          date: "2026-10-05",
          amount: 1_250_000,
          status: "completed" as const,
          channel: "Website",
        },
      ],
    };
    mockGetSalesData.mockResolvedValue(result);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(result);
  });

  it("returns a generic 503 error without leaking connection details", async () => {
    mockGetSalesData.mockRejectedValue(
      new Error("connection failed at 127.0.0.1:55432"),
    );
    mockGetSalesDataSource.mockReturnValue("mysql");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      error: "Data penjualan tidak tersedia. Coba lagi.",
      source: "mysql",
    });
    expect(JSON.stringify(body)).not.toContain("127.0.0.1");
  });

  it("omits the source when its configuration is malformed", async () => {
    mockGetSalesData.mockRejectedValue(new Error("configuration detail"));
    mockGetSalesDataSource.mockReturnValue(undefined);

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Data penjualan tidak tersedia. Coba lagi.",
    });
  });
});
