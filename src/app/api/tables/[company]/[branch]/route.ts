import { NextRequest, NextResponse } from "next/server";

const BASE = "https://v7-hulubeje.cnetcommerce.com/api";

const API_KEY = process.env.HULUBEJE_API_KEY ?? "";
const AUTH_TOKEN = process.env.HULUBEJE_TOKEN ?? "";

const upstreamHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  "X-Metadata": JSON.stringify({
    platform: "Android",
    latitude: 37.4219983,
    longitude: -122.084,
    appVersion: "2.1.7+145",
    code: "0000000000",
    langLocale: "en",
  }),
  ...(API_KEY ? { "x-api-key": API_KEY } : {}),
  ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ company: string; branch: string }> }
) {
  const { company, branch } = await params;
  const url = `${BASE}/tablereservation/get?company=${company}&branch=${branch}`;

  try {
    const upstream = await fetch(url, {
      headers: upstreamHeaders,
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? await upstream.json()
      : await upstream.text();

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream error ${upstream.status}`, detail: body },
        { status: upstream.status }
      );
    }

    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach upstream API", detail: String(err) },
      { status: 502 }
    );
  }
}
