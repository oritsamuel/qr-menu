import { NextRequest, NextResponse } from "next/server";
import { getProxyHeaders } from "@/lib/proxyHeaders";

const BASE           = process.env.HULUBEJE_BASE_URL ?? "https://v7-hulubeje.cnetcommerce.com/api";
const API_KEY        = process.env.HULUBEJE_API_KEY ?? "";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ company: string; branch: string }> }
) {
  const { company, branch } = await params;
  const url = `${BASE}/product/getproductsbytype?companyCode=${company}&orgOUD=${branch}&industryType=1992`;

  try {
    const headers  = await getProxyHeaders();
    const upstream = await fetch(url, { headers, cache: "no-store" });
    const body     = await upstream.json();

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
