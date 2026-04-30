/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Express backend lives on :3001. Proxy /api/* during dev so the frontend
  // can keep calling /api/... without CORS dance.
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
  // Static games (HTML/JS in public/games) keep working as-is.
  async headers() {
    return [
      {
        source: '/games/:path*',
        headers: [
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
        ],
      },
    ];
  },
  // Phaser bundles WebGL helpers — disable strict module resolution warnings.
  webpack: (config) => {
    config.module.exprContextCritical = false;
    return config;
  },
  // Don't fail builds on TS errors during the migration phase.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
