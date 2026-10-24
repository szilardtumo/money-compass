import type { NextConfig } from 'next';

// Validate environment variables on build
import './src/lib/env';

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  reactCompiler: true,
  cacheComponents: true,
  partialPrefetching: true,
  redirects: async () => [{ source: '/', destination: '/dashboard', permanent: false }],
};

export default nextConfig;
