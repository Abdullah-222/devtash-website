import { NextRequest } from "next/server";

import { proxyVentionHtmlPage } from "@/lib/proxy-vention-html-page";

const UPSTREAM_BASE = "services/mobile-development";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await context.params;
  return proxyVentionHtmlPage(request, slug, UPSTREAM_BASE);
}
