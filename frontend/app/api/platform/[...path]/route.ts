import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const baseUrl = process.env.ATLAS_API_URL ?? "http://127.0.0.1:8765";
const maxUploadBytes = 100 * 1024 * 1024;

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
  const imageUpload = method === "POST" && segments.length === 1 && segments[0] === "fields";
  if (imageUpload) {
    const rawLength = request.headers.get("content-length");
    if (!rawLength || !/^\d+$/.test(rawLength)) return NextResponse.json({ error: "Image length is required" }, { status: 411 });
    const length = Number(rawLength);
    if (length < 1 || length > maxUploadBytes) return NextResponse.json({ error: "Image exceeds the 100 MB upload limit" }, { status: 413 });
    headers.set("Content-Length", rawLength);
  }
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: imageUpload ? request.body : method === "POST" ? await request.arrayBuffer() : undefined,
      duplex: "half",
      cache: "no-store",
    } as RequestInit & { duplex: "half" });
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
