import "server-only";

/** Best-effort client IP behind a reverse proxy/CDN. Never trust this for anything
 * beyond rate limiting/audit context — it's attacker-controllable if unproxied. */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim();
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Defense-in-depth CSRF guard for cookie-authenticated mutating requests.
 * SameSite=Lax cookies already block cross-site POSTs from most browsers,
 * but we verify Origin explicitly in case a browser/proxy doesn't honor it.
 */
export function verifySameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) {
    // Same-origin fetches from a same-origin document normally send Origin
    // for state-changing requests; a missing header is treated as suspect.
    return false;
  }
  try {
    const originHost = new URL(origin).host;
    const requestHost = new URL(req.url).host;
    return originHost === requestHost;
  } catch {
    return false;
  }
}
