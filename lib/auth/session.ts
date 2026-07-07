// ─── lib/auth/session.ts ──────────────────────────────────────────────────────
// Edge-compatible session-token primitives.
//
// A session token is a stateless, HMAC-SHA256 signed string of the form
//
//     base64url(payload) . base64url(signature)
//
// where `payload` is `{ u, exp }`. There is no server-side session store — the
// signature is what proves the cookie was minted by us, and `exp` bounds its
// lifetime. This module is deliberately free of Node-only APIs (no `Buffer`,
// no `node:crypto`) so it runs unchanged in both Edge middleware and Node route
// handlers, using only the Web Crypto API and `btoa`/`atob`.

export interface SessionPayload {
  /** The authenticated admin username. */
  u: string;
  /** Expiry, as a UNIX timestamp in seconds. */
  exp: number;
}

const encoder = new TextEncoder();

// ─── base64url helpers ────────────────────────────────────────────────────────
// URL-safe base64 without padding, so tokens are cookie-safe.

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return atob(normalized + padding);
}

// ─── Constant-time comparison ─────────────────────────────────────────────────
// Compares two strings without an early return on the first differing byte, so
// an attacker cannot infer the secret/signature from response timing. Also
// reused by the credential check in ./config. A length mismatch is treated as a
// non-match (length is not itself sensitive here).

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// ─── HMAC signing ─────────────────────────────────────────────────────────────

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return base64UrlEncode(new Uint8Array(signature));
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Mint a signed session token for `username`, valid for `maxAgeSeconds`.
 */
export async function createSessionToken(
  username: string,
  secret: string,
  maxAgeSeconds: number
): Promise<string> {
  const payload: SessionPayload = {
    u: username,
    exp: nowSeconds() + maxAgeSeconds,
  };
  const payloadSegment = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await hmacSign(payloadSegment, secret);
  return `${payloadSegment}.${signature}`;
}

/**
 * Verify a session token's signature and expiry. Returns the decoded payload
 * when valid, or `null` for any malformed, tampered, or expired token.
 */
export async function verifySessionToken(
  token: string,
  secret: string
): Promise<SessionPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadSegment, signature] = parts;
  const expected = await hmacSign(payloadSegment, secret);
  if (!constantTimeEqual(signature, expected)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadSegment)) as SessionPayload;
  } catch {
    return null;
  }

  if (typeof payload.exp !== "number" || payload.exp < nowSeconds()) return null;
  if (typeof payload.u !== "string" || payload.u.length === 0) return null;

  return payload;
}
