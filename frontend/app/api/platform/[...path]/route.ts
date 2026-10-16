import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const baseUrl = process.env.ATLAS_API_URL ?? "http://127.0.0.1:8765";

async function proxy(request: NextRequest, segments: string[], method: "GET" | "POST") {
  if (!segments.length || segments.some((part) => !/^[a-zA-Z0-9_-]+$/.test(part))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const url = `${baseUrl.replace(/\/$/, "")}/api/${segments.map(encodeURIComponent).join("/")}`;
  const headers = new Headers();
  if (request.headers.has("content-type")) headers.set("Content-Type", request.headers.get("content-type")!);
  if (request.headers.has("x-filename")) headers.set("X-Filename", request.headers.get("x-filename")!);
  if (request.headers.has("x-filename-encoded")) headers.set("X-Filename-Encoded", request.headers.get("x-filename-encoded")!);
  if (process.env.ATLAS_API_TOKEN) headers.set("Authorization", `Bearer ${process.env.ATLAS_API_TOKEN}`);
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: method === "POST" ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    });
    const outputHeaders = new Headers();
    for (const name of ["content-type", "content-disposition", "cache-control"]) {
      const value = response.headers.get(name);
      if (value) outputHeaders.set(name, value);
    }
    outputHeaders.set("X-Content-Type-Options", "nosniff");
    return new NextResponse(response.body, { status: response.status, headers: outputHeaders });
  } catch {
    return NextResponse.json({ error: "Local analysis service is unavailable. Start it with ./linux-v1/run.sh service." }, { status: 503 });
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await context.params).path, "GET");
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await context.params).path, "POST");
}
