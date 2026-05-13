import { NextRequest } from "next/server";

import { proxyVentionHtmlPage } from "@/lib/proxy-vention-html-page";

/**
 * Canonical page is `/company/contacts` (`/contact` only 301s). Use that for
 * `/contact` so `__NEXT_DATA__` matches production. Subpaths keep `/contact/…`
 * on upstream.
 */
const UPSTREAM_BASE = "company/contacts";
const UPSTREAM_BASE_WITH_SLUG = "contact";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await context.params;
  const base = slug?.length ? UPSTREAM_BASE_WITH_SLUG : UPSTREAM_BASE;
  return proxyVentionHtmlPage(request, slug, base);
}
