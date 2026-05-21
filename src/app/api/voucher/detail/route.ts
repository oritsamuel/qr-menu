import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxyHeaders";

const BASE = process.env.HULUBEJE_BASE_URL ?? "https://v7-hulubeje.cnetcommerce.com/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const voucherCode  = searchParams.get("voucherCode");
  const companyCode  = searchParams.get("companyCode");
  const industryType = searchParams.get("industryType") ?? "1992";

  if (!voucherCode || !companyCode) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const headers  = await getProxyHeaders();
    const upstream = await fetch(
      `${BASE}/voucher/gethistorydetail?voucherCode=${encodeURIComponent(voucherCode)}&companyCode=${companyCode}&industryType=${industryType}`,
      { headers, cache: "no-store" }
    );
    const data = await upstream.json();
    if (!upstream.ok) {
      return NextResponse.json({ error: `Upstream error ${upstream.status}`, detail: data }, { status: upstream.status });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to reach upstream API", detail: String(err) }, { status: 502 });
  }
}
