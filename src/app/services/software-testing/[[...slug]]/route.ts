import { NextRequest } from "next/server";

import { proxyVentionHtmlPage } from "@/lib/proxy-vention-html-page";

/** Live Vention path (matches `http://localhost:3000/services/software-testing`). */
const UPSTREAM_BASE = "services/software-testing";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await context.params;
  return proxyVentionHtmlPage(request, slug, UPSTREAM_BASE);
}
