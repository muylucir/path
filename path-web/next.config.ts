import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  transpilePackages: [
    "@cloudscape-design/components",
    "@cloudscape-design/chat-components",
    "@cloudscape-design/collection-hooks",
    "@cloudscape-design/design-tokens",
    "@cloudscape-design/global-styles",
  ],
  allowedDevOrigins: ["path.workloom.net"],
  async redirects() {
    return [
      { source: "/feasibility", destination: "/design", permanent: true },
      { source: "/analyze", destination: "/design", permanent: true },
      { source: "/results", destination: "/design", permanent: true },
      { source: "/intro", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self' data:;",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
