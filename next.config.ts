import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Loaded at runtime (not bundled) so the Datadog tracer can instrument them.
  serverExternalPackages: ["dd-trace", "pino"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
