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
 * Vention Next.js chunks that we serve from our local patched copies in `public/js/`
 * instead of proxying from ventionteams.com CDN.
 * Key: the chunk filename (without path). Value: local path under /js/.
 */
const LOCAL_PATCHED_CHUNKS: Record<string, string> = {
  "1426.811b168004fc89cd.js": "/js/1426.811b168004fc89cd.js",
  "_app-b60cb08a8e4d3a7d.js": "/js/_app-b60cb08a8e4d3a7d.js",
};

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
    const chunkFilename = pathname.split("/").pop() ?? "";
    if (LOCAL_PATCHED_CHUNKS[chunkFilename]) {
      const url = req.nextUrl.clone();
      url.pathname = LOCAL_PATCHED_CHUNKS[chunkFilename];
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
