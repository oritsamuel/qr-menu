import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxyHeaders";

const BASE = "https://v7-hulubeje.cnetcommerce.com/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code        = searchParams.get("code");
  const companyCode = searchParams.get("companyCode");
  const branchCode  = searchParams.get("branchCode");

  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  const params = new URLSearchParams({ code });
  if (companyCode) params.set("companyCode", companyCode);
  if (branchCode)  params.set("branchCode", branchCode);

  // Note: the upstream endpoint name has a typo ("paymne") — that's intentional
  const url = `${BASE}/payment/getuserpaymnetoption?${params.toString()}`;

  try {
    const headers  = await getProxyHeaders();
    const upstream = await fetch(url, { headers, cache: "no-store" });
    const data     = await upstream.json();

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
