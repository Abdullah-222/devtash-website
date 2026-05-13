import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { shouldServeProxiedVentionPage } from "@/config/proxied-html-routes";

const VENTION_ORIGIN = "https://ventionteams.com";

/** Served from `public/images/` — do not rewrite (Vention CDN often returns 403 when Host is local). */
const LOCAL_IMAGE_PATHS = new Set([
  "/images/vention-logo.png",
  "/images/vention-logo-trademarked.png",
]);

/**
 * Vention Next.js chunks we serve from `public/js/` (patched). Exact filenames
 * or patterns — upstream may ship a new `_app-*.js` hash; always map to our build.
 */
const LOCAL_PATCHED_CHUNKS: Record<string, string> = {
  "1426.811b168004fc89cd.js": "/js/1426.811b168004fc89cd.js",
  "%5B%5B...slug%5D%5D-ee5e09c6c23ee121.js":
    "/js/%5B%5B...slug%5D%5D-ee5e09c6c23ee121.js?v=hubfix1",
  "[[...slug]]-ee5e09c6c23ee121.js":
    "/js/%5B%5B...slug%5D%5D-ee5e09c6c23ee121.js?v=hubfix1",
};

const LOCAL_PATCHED_APP_PATH = "/js/_app-b60cb08a8e4d3a7d.js";
const LOCAL_PATCHED_APP_SEARCH = "?v=nokillswitch1";

function localPatchedChunkDestination(pathname: string): string | null {
  const chunkFilename = (pathname.split("/").pop() ?? "").split("?")[0];
  if (
    chunkFilename.startsWith("_app-") &&
    chunkFilename.endsWith(".js") &&
    pathname.includes("/chunks/pages/")
  ) {
    return `${LOCAL_PATCHED_APP_PATH}${LOCAL_PATCHED_APP_SEARCH}`;
  }
  const mapped = LOCAL_PATCHED_CHUNKS[chunkFilename];
  return mapped ?? null;
}

/** Proxied Vention HTML loads `/_next/static/chunks/pages/*`; Turbopack must not treat those as app routes. */
function shouldProxyVentionNextAsset(pathname: string) {
  if (!pathname.startsWith("/_next/")) return false;
  if (pathname.startsWith("/_next/webpack")) return false;
  if (pathname.includes("turbopack")) return false;
  if (pathname.includes("hot-update")) return false;
  if (pathname.startsWith("/_next/data")) return false;
  return true;
}

function rewriteToVention(req: NextRequest) {
  const u = new URL(req.nextUrl.pathname + req.nextUrl.search, VENTION_ORIGIN);
  return NextResponse.rewrite(u);
}

function isProbablyStaticAsset(pathname: string) {
  // Keep Next internals + common static folders working.
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/css/")) return true;
  if (pathname.startsWith("/js/")) return true;
  if (pathname.startsWith("/imgs/")) return true;
  if (pathname.startsWith("/images/")) return true;
  if (pathname.startsWith("/media/")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;

  // Any obvious file extension should be served as a real file from /public.
  if (/\.[a-zA-Z0-9]{2,6}$/.test(pathname)) return true;

  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Avoid rewriting the export entrypoint itself.
  if (pathname === "/index.html") return NextResponse.next();

  if (shouldProxyVentionNextAsset(pathname)) {
    // Serve locally-patched chunks instead of forwarding to Vention CDN.
    const dest = localPatchedChunkDestination(pathname);
    if (dest) {
      const url = req.nextUrl.clone();
      const [pathPart, searchPart] = dest.split("?");
      url.pathname = pathPart;
      url.search = searchPart ? `?${searchPart}` : "";
      return NextResponse.rewrite(url);
    }
    return rewriteToVention(req);
  }

  if (pathname.startsWith("/api/")) {
    return rewriteToVention(req);
  }

  if (LOCAL_IMAGE_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/images/")) {
    return rewriteToVention(req);
  }

  // Let Next.js serve proxied Vention HTML (see `app/**/[[...slug]]/route.ts` + `proxied-html-routes`).
  if (shouldServeProxiedVentionPage(pathname)) return NextResponse.next();

  // The clone is a single-page export; route all “app paths” to the same HTML
  // so client-side navigation can boot the exported Next bundle.
  if (!isProbablyStaticAsset(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/index.html";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
