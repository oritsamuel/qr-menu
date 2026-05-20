import { getToken } from "./auth";

const API_KEY = process.env.HULUBEJE_API_KEY ?? "";

export async function getProxyHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return {
    "Content-Type": "application/json",
    "X-Metadata": JSON.stringify({
      platform: "Android",
      latitude: 37.4219983,
      longitude: -122.084,
      appVersion: "2.1.7+145",
      code: "0000000000",
      langLocale: "en",
    }),
    "x-api-key": API_KEY,
    Authorization: `Bearer ${token}`,
  };
}
