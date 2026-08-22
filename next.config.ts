import type { NextConfig } from 'next';

// Validate environment variables on build
import './src/lib/env';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  reactCompiler: true,
  cacheComponents: true,
};

export default nextConfig;
