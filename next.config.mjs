/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['api.agora.com'], // Add your API domain if using external images
  },
}

export default nextConfig