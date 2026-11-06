import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Classic caching model: catalogue pages render per request from the API.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig
