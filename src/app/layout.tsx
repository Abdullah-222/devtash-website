import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Software Development Company | Vention",
  description:
    "Mirrored VentionTeams homepage running inside a Next.js shell (static export + proxied Next assets).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
