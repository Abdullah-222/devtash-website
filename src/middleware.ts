import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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
