import type { NextConfig } from "next";

// Baseline security headers. A strict nonce-based CSP is deferred to the
// hardening phase: it would force dynamic rendering and conflict with the
// static-first architecture, so it needs deliberate testing, not a default.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Camera stays self-allowed for the WebAR career preview.
    value: "camera=(self), microphone=(), geolocation=(), payment=()",
  },
] as const;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The emailed results PDF is built server-side; PDFKit (under pdfmake)
  // reads its own data files at runtime, so it must not be bundled.
  serverExternalPackages: ["pdfmake"],
  // Default image formats (WebP). AVIF was tried: a few KB smaller on these
  // small images, but slower to encode, and a stuck AVIF job left the header
  // logo blank in dev. Not worth it at this size.
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [...securityHeaders],
      },
    ];
  },
};

export default nextConfig;
