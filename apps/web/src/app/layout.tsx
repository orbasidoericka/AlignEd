import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";

import { Analytics } from "@/components/analytics";
import { SiteFooter } from "@/components/blocks/site-footer";
import { SiteHeader } from "@/components/blocks/site-header";
import { Providers } from "@/components/providers";

// CSS variables map to Tailwind font tokens for consistent typography.
const sora = Sora({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AlignEd",
    template: "%s | AlignEd",
  },
  description:
    "Data-driven career guidance for SHS students in Central Luzon.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-svh flex-col bg-background font-sans text-foreground">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <Providers>
          <SiteHeader />
          <div id="content" className="flex flex-1 flex-col">
            {children}
          </div>
          <SiteFooter />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
