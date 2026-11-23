import { beforeEach, describe, expect, it, vi } from "vitest";
import { getReadiness } from "@/lib/sales-repository";
import { GET } from "./route";

vi.mock("@/lib/sales-repository", () => ({
  getReadiness: vi.fn(),
}));

const mockGetReadiness = vi.mocked(getReadiness);

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("reports ready for the demo data source", async () => {
    mockGetReadiness.mockResolvedValue({
      ready: true,
      source: "demo",
      database: "not_required",
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ready: true,
      source: "demo",
      database: "not_required",
    });
  });

  it("returns 503 readiness without exposing a database error", async () => {
    mockGetReadiness.mockResolvedValue({
      ready: false,
      source: "mysql",
      database: "unavailable",
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      ready: false,
      source: "mysql",
      database: "unavailable",
    });
    expect(JSON.stringify(body)).not.toContain("127.0.0.1");
  });

  it("reports missing MySQL configuration separately from an unavailable server", async () => {
    mockGetReadiness.mockResolvedValue({
      ready: false,
      source: "mysql",
      database: "misconfigured",
    });

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ready: false,
      source: "mysql",
      database: "misconfigured",
    });
  });
});
