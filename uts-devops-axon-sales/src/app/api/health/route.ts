import { NextResponse } from "next/server";
import { getReadiness } from "@/lib/sales-repository";
import { withMetrics } from "@/lib/with-metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withMetrics("/api/health", async () => {
  const readiness = await getReadiness();
  return NextResponse.json(readiness, {
    status: readiness.ready ? 200 : 503,
  });
});
