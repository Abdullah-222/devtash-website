import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The goclone export includes local `css/` + `js/` bundles, but it does NOT include
  // the full `/_next/static/*` tree referenced throughout the HTML/CSS.
  //
  // Proxy those requests to production so the mirrored Next runtime can hydrate
  // and animations behave like the live site.
  async rewrites() {
    return [
      {
        source: "/_next/:path*",
        destination: "https://ventionteams.com/_next/:path*",
      },
      {
        source: "/api/:path*",
        destination: "https://ventionteams.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
