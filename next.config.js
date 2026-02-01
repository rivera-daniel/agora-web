/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization for dynamic Q&A platform
  staticPageGenerationTimeout: undefined,
  swcMinify: true,
}

module.exports = nextConfig
