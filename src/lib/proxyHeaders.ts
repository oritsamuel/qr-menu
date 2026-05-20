import { getToken } from "./auth";

const API_KEY    = process.env.HULUBEJE_API_KEY ?? "";
const APP_VERSION = process.env.HULUBEJE_APP_VERSION ?? "2.1.7+145";
const GUEST_CODE  = process.env.HULUBEJE_GUEST_CODE ?? "0000000000";

export async function getProxyHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return {
    "Content-Type": "application/json",
    "X-Metadata": JSON.stringify({
      platform: "Android",
      latitude: 37.4219983,
      longitude: -122.084,
      appVersion: APP_VERSION,
      code: GUEST_CODE,
      langLocale: "en",
    }),
    "x-api-key": API_KEY,
    Authorization: `Bearer ${token}`,
  };
}
