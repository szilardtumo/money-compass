import type { NextConfig } from 'next';

// Validate environment variables on build
import './src/lib/env';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {
    reactCompiler: true,
    dynamicIO: true,
  },
};

export default nextConfig;
