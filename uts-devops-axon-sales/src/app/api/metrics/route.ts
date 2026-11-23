import { NextResponse } from "next/server";
import { register } from "@/lib/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const metrics = await register.metrics();
  return new NextResponse(metrics, {
    status: 200,
    headers: {
      "Content-Type": register.contentType,
    },
  });
}
