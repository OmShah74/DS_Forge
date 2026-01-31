import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Silence Turbopack/Webpack conflict by providing an empty turbopack config
  turbopack: {},
  // This specific webpack config is required for Docker Hot-Reloading on Windows
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
};

export default nextConfig;