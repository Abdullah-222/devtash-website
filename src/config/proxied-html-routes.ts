/**
 * Paths that skip the static `index.html` shell so Next can serve them
 * (e.g. App Router `route.ts` proxies that inject CSS/JS).
 */
export const PROXIED_HTML_ROUTE_PREFIXES = [
  "/software-development",
  "/services/web-development",
  "/services/software-testing",
  "/services/mobile-development",
  "/services/devops",
  "/services/cloud-consulting",
  "/solutions/cybersecurity",
  "/company/contacts",
  "/contact",
] as const;

export function shouldServeProxiedVentionPage(pathname: string): boolean {
  for (const prefix of PROXIED_HTML_ROUTE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return true;
  }
  return false;
}

/**
 * Optional extra full-page proxies via `next.config.ts` rewrites only.
 * Proxies: `app/software-development/[[...slug]]/route.ts`,
 * `app/services/web-development/[[...slug]]/route.ts`,
 * `app/services/software-testing/[[...slug]]/route.ts`,
 * `app/services/mobile-development/[[...slug]]/route.ts`,
 * `app/services/devops/[[...slug]]/route.ts`,
 * `app/services/cloud-consulting/[[...slug]]/route.ts`,
 * `app/solutions/cybersecurity/[[...slug]]/route.ts`,
 * `app/company/contacts/[[...slug]]/route.ts`,
 * `app/contact/[[...slug]]/route.ts` (proxies canonical `company/contacts` for `/contact`).
 */
export function proxiedHtmlRewrites(): Array<{
  source: string;
  destination: string;
}> {
  return [];
}
