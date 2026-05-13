import { NextRequest } from "next/server";

import { proxyVentionHtmlPage } from "@/lib/proxy-vention-html-page";

/** Navbar “Contact us” — canonical on Vention: /company/contacts */
const UPSTREAM_BASE = "company/contacts";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await context.params;
  return proxyVentionHtmlPage(request, slug, UPSTREAM_BASE);
}
