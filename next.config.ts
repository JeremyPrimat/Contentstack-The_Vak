import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // One build folder per site so the four local dev servers can run side by side.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.contentstack.io" },
      { protocol: "https", hostname: "*.contentstack.io" },
      { protocol: "https", hostname: "*.contentstack.com" },
    ],
  },
};

export default nextConfig;
