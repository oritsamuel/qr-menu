import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxyHeaders";

const BASE = "https://v7-hulubeje.cnetcommerce.com/api";

export async function POST(req: NextRequest) {
  try {
    const body    = await req.json();
    const headers = await getProxyHeaders();

    const upstream = await fetch(`${BASE}/payment/authorization`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream error ${upstream.status}`, detail: data },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach upstream API", detail: String(err) },
      { status: 502 }
    );
  }
}
