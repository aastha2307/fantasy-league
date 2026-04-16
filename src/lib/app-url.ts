/**
 * Public site origin for metadata (Open Graph, canonical) and absolute links.
 * Set `APP_URL` in production, e.g. `https://fantasy.example.com` (no trailing slash).
 */
export function getAppUrlFromEnv(): string {
  const u = process.env.APP_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function getMetadataBase(): URL {
  try {
    return new URL(getAppUrlFromEnv());
  } catch {
    return new URL("http://localhost:3000");
  }
}

/**
 * Prefer `APP_URL`; otherwise infer from reverse-proxy headers or the request URL (for API routes).
 */
export function getAppUrlFromRequest(request: Request): string {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const host = forwardedHost.split(",")[0].trim();
    const proto = forwardedProto && forwardedProto.length > 0 ? forwardedProto : "https";
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}
