import { NextResponse } from "next/server";
import { getSalesData, getSalesDataSource } from "@/lib/sales-repository";
import { withMetrics } from "@/lib/with-metrics";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withMetrics("/api/sales", async () => {
  try {
    const data = await getSalesData();
    logger.info("Sales data fetched successfully", {
      action: "fetch_sales",
      source: data.source,
      count: data.sales.length,
    });
    return NextResponse.json(data);
  } catch (err: unknown) {
    const source = getSalesDataSource();
    logger.error("Failed to fetch sales data", err, {
      action: "fetch_sales",
      source: source ?? "unknown",
    });
    return NextResponse.json(
      {
        error: "Data penjualan tidak tersedia. Coba lagi.",
        ...(source ? { source } : {}),
      },
      { status: 503 },
    );
  }
});

