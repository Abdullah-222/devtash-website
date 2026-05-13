import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = "https://ventionteams.com";

const NEXT_IMAGE_SENTINEL = "__VENTION_NEXT_IMAGE_PREFIX__";

/**
 * Load `/_next/image?…` from Vention’s CDN in the browser. Localhost proxies
 * often return 403 because the optimizer resolves `url=/api/…` against the
 * wrong host; absolute CDN URLs match production behavior.
 */
function rewriteNextImageUrlsToVentionOrigin(html: string): string {
  if (!html.includes("/_next/image?")) return html;
  return html
    .replaceAll(`${UPSTREAM}/_next/image?`, NEXT_IMAGE_SENTINEL)
    .replaceAll("/_next/image?", `${UPSTREAM}/_next/image?`)
    .replaceAll(NEXT_IMAGE_SENTINEL, `${UPSTREAM}/_next/image?`);
}

/**
 * Patched Pages `main` from `public/js` (same build id as live Vention). Replacing the upstream
 * `/_next/static/chunks/main-*.js` URL avoids loading unpatched code **and** avoids patching
 * `HTMLHeadElement.prototype.querySelector` (that fights `next/head` → React #200 / removeChild).
 */
const LOCAL_PATCHED_MAIN = "/js/main-b88b2c128c536bfa.js?v=headfix6";

/** Injected before `</body>` so Next head manager is not thrown off by extra `<head>` tags. */
const BODY_INJECT = `
<link rel="stylesheet" href="/css/vention-industries-accordion.css" />
<script defer src="/js/vention-industries-accordion.js"></script>
<div id="info-tooltip-portal" style="position:relative;z-index:9999"></div>
`;

/**
 * Inline script that patches `document.getElementById` to auto-create the
 * `#info-tooltip-portal` portal container if it is missing. Injected early in
 * `<head>` so it runs before any Vention React/Next chunk (even cached ones).
 */
const PORTAL_FIX_SCRIPT =
  `<script>/* portal-fix */!function(){var _g=Document.prototype.getElementById;` +
  `Document.prototype.getElementById=function(id){var el=_g.call(this,id);` +
  `if(!el&&id==='info-tooltip-portal'){el=document.createElement('div');` +
  `el.id=id;(document.body||document.documentElement).appendChild(el);}` +
  `return el;};}();</script>`;

/** Client-side: Next may still emit relative `/_next/image?…` after navigation. */
const IMAGE_CDN_FIX_SCRIPT =
  `<script>/* img-cdn */!function(){var O="https://ventionteams.com";` +
  `function F(u){if(!u||typeof u!=="string")return u;` +
  `if(u.indexOf("https://ventionteams.com")===0)return u;` +
  `if(u.indexOf("/_next/image?")===0)return O+u;return u;}` +
  `function P(){` +
  `document.querySelectorAll('img[src^="/_next/image?"]').forEach(function(e){e.src=F(e.getAttribute("src"));});` +
  `document.querySelectorAll('link[rel="preload"][as="image"][href^="/_next/image?"]').forEach(function(e){e.href=F(e.getAttribute("href"));});` +
  `document.querySelectorAll('link[rel="preload"][imagesrcset*="/_next/image"]').forEach(function(e){` +
  `var s=e.getAttribute("imagesrcset");if(!s)return;` +
  `e.setAttribute("imagesrcset",s.split(",").map(function(p){` +
  `var t=p.trim(),sp=t.split(/\\s+/);if(sp[0])sp[0]=F(sp[0]);return sp.join(" ");}).join(", "));});` +
  `document.querySelectorAll('source[srcset*="/_next/image"]').forEach(function(e){` +
  `var s=e.getAttribute("srcset");if(!s)return;` +
  `e.setAttribute("srcset",s.split(",").map(function(p){` +
  `var t=p.trim(),sp=t.split(/\\s+/);if(sp[0])sp[0]=F(sp[0]);return sp.join(" ");}).join(", "));});}` +
  `var T;function Q(){clearTimeout(T);T=setTimeout(P,0);}` +
  `if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",Q);else Q();` +
  `new MutationObserver(Q).observe(document.documentElement,{subtree:1,childList:1,attributes:1,attributeFilter:["src","srcset","href"]});` +
  `}();</script>`;

/** Force root-relative resolution for `js/…`, `css/…`, `/_next/image`, etc. on nested paths. */
function ensureRootBaseHref(html: string): string {
  const headClose = html.search(/<\/head>/i);
  const headSlice = headClose === -1 ? html : html.slice(0, headClose);
  if (/<base\s/i.test(headSlice)) {
    return html.replace(/<base[^>]*>/i, '<base href="/" />' + PORTAL_FIX_SCRIPT + IMAGE_CDN_FIX_SCRIPT);
  }
  return html.replace(
    /<head(\s[^>]*)?>/i,
    (m) => m + '<base href="/" />' + PORTAL_FIX_SCRIPT + IMAGE_CDN_FIX_SCRIPT,
  );
}

/** Point `<script src=…main-….js>` at our patched bundle (same filename as current Vention export). */
function rewriteMainChunkToLocalPatched(html: string): string {
  return html.replace(
    /src=(["'])((?:https:\/\/ventionteams\.com)?\/_next\/static\/chunks\/main-[a-zA-Z0-9_.-]+\.js)\1/g,
    `src=$1${LOCAL_PATCHED_MAIN}$1`,
  );
}

/**
 * @param upstreamBasePath — path on ventionteams.com **without** leading slash
 *   (e.g. `software-development`, `services/web-development`).
 */
export async function proxyVentionHtmlPage(
  request: NextRequest,
  slug: string[] | undefined,
  upstreamBasePath: string,
): Promise<Response> {
  const tail = slug?.length ? slug.join("/") : "";
  const path = tail ? `${upstreamBasePath}/${tail}` : upstreamBasePath;
  const upstream = new URL(`/${path}`, UPSTREAM);
  upstream.search = request.nextUrl.search;

  const res = await fetch(upstream, {
    headers: {
      "user-agent":
        request.headers.get("user-agent") ||
        "Mozilla/5.0 (compatible; venture-clone/1.0)",
      accept:
        request.headers.get("accept") ||
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": request.headers.get("accept-language") || "en-US,en;q=0.9",
    },
    redirect: "follow",
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return new NextResponse(res.body, { status: res.status, headers: res.headers });
  }

  let html = await res.text();
  html = ensureRootBaseHref(html);
  html = rewriteMainChunkToLocalPatched(html);
  html = rewriteNextImageUrlsToVentionOrigin(html);

  const bodyClose = html.lastIndexOf("</body>");
  if (bodyClose !== -1) {
    html = html.slice(0, bodyClose) + BODY_INJECT + html.slice(bodyClose);
  } else if (html.includes("</head>")) {
    html = html.replace("</head>", `${BODY_INJECT}</head>`);
  } else {
    html = `${BODY_INJECT}${html}`;
  }

  const headers = new Headers(res.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.set("cache-control", "private, no-store");

  return new NextResponse(html, { status: res.status, headers });
}
