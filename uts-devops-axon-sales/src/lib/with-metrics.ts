import { NextResponse } from "next/server";
import { httpRequestDurationSeconds, httpRequestsTotal } from "./metrics";

export function withMetrics<TArgs extends unknown[]>(
  route: string,
  handler: (...args: TArgs) => Promise<Response | NextResponse> | Response | NextResponse,
) {
  return async function (...args: TArgs): Promise<Response | NextResponse> {
    const req = args[0] as Request | undefined;
    const method = req?.method ?? "GET";
    const stopTimer = httpRequestDurationSeconds.startTimer({ method, route });
    try {
      const response = await handler(...args);
      const status = response.status.toString();
      httpRequestsTotal.inc({ method, route, status });
      stopTimer({ status });
      return response;
    } catch (error) {
      httpRequestsTotal.inc({ method, route, status: "500" });
      stopTimer({ status: "500" });
      throw error;
    }
  };
}
