import { NextRequest, NextResponse } from "next/server";

const BASE = "https://v7-hulubeje.cnetcommerce.com/api";

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
  "x-api-key": process.env.HULUBEJE_API_KEY ?? "",
  Authorization: `Bearer ${process.env.HULUBEJE_TOKEN ?? ""}`,
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tin: string }> }
) {
  const { tin } = await params;
  const url = `${BASE}/routing/getcompanybytin?tin=${tin}`;

  try {
    const upstream = await fetch(url, {
      headers: upstreamHeaders,
      cache: "no-store",
    });

    const body = await upstream.json();

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
