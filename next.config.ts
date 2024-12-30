import type { NextConfig } from 'next';

const config = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
  // Configuration pour les composants Shadcn/ui
  transpilePackages: ['@/components/ui'],
  
  // Configuration des images pour les placeholders
  images: {
    domains: ['api.placeholder.com'],
  },
  
  // Configuration TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },

  // Configuration des environnements
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:3000',
  },

  // Configuration webpack pour gérer les modules Node.js
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
} satisfies NextConfig;

export default config;