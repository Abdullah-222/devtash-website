import { NextRequest } from "next/server";

import { proxyVentionHtmlPage } from "@/lib/proxy-vention-html-page";

/** Live Vention path: https://ventionteams.com/solutions/cybersecurity */
const UPSTREAM_BASE = "solutions/cybersecurity";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await context.params;
  return proxyVentionHtmlPage(request, slug, UPSTREAM_BASE);
}
