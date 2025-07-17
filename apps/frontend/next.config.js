/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  transpilePackages: [],
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: [],
  images: {
    domains: [],
  },
}

module.exports = nextConfig