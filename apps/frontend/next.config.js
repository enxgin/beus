/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  transpilePackages: [],
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
      serverExternalPackages: [],
  },
  images: {
    domains: [],
  },
}

module.exports = nextConfig