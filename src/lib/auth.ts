/**
 * Server-side token manager for Hulubeje API.
 * Automatically logs in as the guest account and refreshes the token when expired.
 * All proxy routes call getToken() instead of reading from env directly.
 */

const BASE           = process.env.HULUBEJE_BASE_URL ?? "https://v7-hulubeje.cnetcommerce.com/api";
const API_KEY        = process.env.HULUBEJE_API_KEY ?? "";
const GUEST_CODE     = process.env.HULUBEJE_GUEST_CODE ?? "0000000000";
const GUEST_PASSWORD = process.env.HULUBEJE_GUEST_PASSWORD ?? "0000000000";
const APP_VERSION    = process.env.HULUBEJE_APP_VERSION ?? "2.1.7+145";

interface TokenState {
  token: string;
  expiresAt: number; // unix timestamp in seconds
}

// Module-level singleton — persists across requests in the same Node.js process
let tokenState: TokenState | null = null;

function parseExpiry(jwt: string): number {
  try {
    const payload = jwt.split(".")[1];
    const padded  = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    return decoded.exp as number;
  } catch {
    // If we can't parse, treat as expired
    return 0;
  }
}

function isExpired(state: TokenState): boolean {
  // Refresh 60 seconds before actual expiry to avoid edge cases
  return Date.now() / 1000 >= state.expiresAt - 60;
}

async function login(): Promise<string> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "X-Metadata": JSON.stringify({
        platform: "Android",
        latitude: 0,
        longitude: 0,
        appVersion: APP_VERSION,
        code: GUEST_CODE,
        langLocale: "en",
      }),
    },
    body: JSON.stringify({ code: GUEST_CODE, password: GUEST_PASSWORD }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Auth login failed: ${res.status}`);
  }

  const json = await res.json();
  if (!json.isSuccessful) {
    throw new Error(json.errorMessages?.join(", ") ?? "Login failed");
  }

  const token: string = json.data.token;
  return token;
}

export async function getToken(): Promise<string> {
  // Return cached token if still valid
  if (tokenState && !isExpired(tokenState)) {
    return tokenState.token;
  }

  // Login to get a fresh token
  const token = await login();
  tokenState = {
    token,
    expiresAt: parseExpiry(token),
  };

  return token;
}
