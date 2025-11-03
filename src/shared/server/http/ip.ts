// src/server/http/ip.ts

/**
 * Extract the best-guess client IP from a standard Web Request.
 * - Works on Edge and Node runtimes (no direct socket access).
 * - Prefers RFC 7239 `Forwarded`, then X-Forwarded-For, X-Real-IP, CF-Connecting-IP.
 * - Returns `null` if nothing trustworthy is present.
 */

function stripDelimiters(value: string): string {
  // Remove surrounding quotes or IPv6 brackets
  let v = value.trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).trim();
  if (v.startsWith("[") && v.endsWith("]")) v = v.slice(1, -1).trim();
  return v;
}

function parseForwardedFor(forwarded: string): string | null {
  // Example: Forwarded: for=192.0.2.60;proto=http;by=203.0.113.43
  // Multiple entries can be comma-separated. We scan left-to-right.
  // See RFC 7239 §4.
  const entries = forwarded.split(","); // handle multiple hops
  for (const entry of entries) {
    const parts = entry.split(";"); // params like for=, proto=, by=
    for (const part of parts) {
      const [rawKey, rawVal] = part.split("=");
      if (!rawKey || !rawVal) continue;
      const key = rawKey.trim().toLowerCase();
      if (key !== "for") continue;
      const val = stripDelimiters(rawVal);
      if (val) return val;
    }
  }
  return null;
}

export function getClientIp(req: Request): string | null {
  const headers = req.headers;

  // 1) RFC 7239 Forwarded
  const fwd = headers.get("forwarded");
  if (fwd) {
    const ip = parseForwardedFor(fwd);
    if (ip) return ip;
  }

  // 2) X-Forwarded-For: "client, proxy1, proxy2"
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return stripDelimiters(first);
  }

  // 3) Common reverse-proxy headers
  const real = headers.get("x-real-ip");
  if (real?.trim()) return stripDelimiters(real);

  const cf = headers.get("cf-connecting-ip");
  if (cf?.trim()) return stripDelimiters(cf);

  // No reliable header available in this environment
  return null;
}
