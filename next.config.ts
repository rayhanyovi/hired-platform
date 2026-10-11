import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The in-app preview uses the loopback IP rather than localhost.
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        // Preserve Next's scoped class exports for component CSS modules.
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
