import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Nunito_Sans, Poppins } from "next/font/google";
import "./globals.css";

import { Analytics } from "@/components/analytics";
import { Providers } from "@/components/providers";

// CSS variables map to Tailwind font tokens for consistent typography.
const nunitoSans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
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
      className={`${nunitoSans.variable} ${poppins.variable} ${jetbrainsMono.variable} h-full antialiased`}
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
          <div id="content" className="flex flex-1 flex-col">
            {children}
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
