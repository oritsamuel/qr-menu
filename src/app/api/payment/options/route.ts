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
    const upstream = await fetch(url, {
      headers: upstreamHeaders,
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
    console.error("[payment/options] upstream fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to reach upstream API", detail: String(err) },
      { status: 502 }
    );
  }
}
