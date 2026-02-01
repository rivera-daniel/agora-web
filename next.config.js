/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  swcMinify: true,
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  staticPageGenerationTimeout: 0,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://agora-api-production.up.railway.app/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
