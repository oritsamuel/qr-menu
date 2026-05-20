import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxyHeaders";

const BASE = "https://v7-hulubeje.cnetcommerce.com/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  try {
    const headers  = await getProxyHeaders();
    const upstream = await fetch(
      `${BASE}/payment/generatetransactionid?code=${encodeURIComponent(code)}`,
      { headers, cache: "no-store" }
    );

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
