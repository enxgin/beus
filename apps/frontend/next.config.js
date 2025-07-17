/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  transpilePackages: [],
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: [],
  },
  images: {
    domains: [],
  },
}

module.exports = nextConfig