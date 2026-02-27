import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/admin";

export async function POST(req: Request) {
  try {
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { projectId, dataset, apiToken } = (await req.json()) as {
      projectId?: string;
      dataset?: string;
      apiToken?: string;
    };

    if (!projectId) {
      return NextResponse.json(
        { connected: false, message: "Project ID is required" },
        { status: 400 },
      );
    }

    const ds = dataset || "production";

    // Query the Sanity CDN API to test the connection
    const url = `https://${projectId}.api.sanity.io/v2023-05-03/data/query/${ds}?query=count(*[_type=="course"])`;
    const headers: Record<string, string> = {};
    if (apiToken) {
      headers.Authorization = `Bearer ${apiToken}`;
    }

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({
        connected: false,
        message: `Sanity returned ${res.status}: ${body.slice(0, 200)}`,
      });
    }

    const data = await res.json();
    const courseCount = typeof data.result === "number" ? data.result : 0;

    return NextResponse.json({
      connected: true,
      message: `Connected to ${projectId}/${ds}`,
      courseCount,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to test connection";
    return NextResponse.json({ connected: false, message });
  }
}
