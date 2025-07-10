/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname, '../../'),
  },
  transpilePackages: [],
  images: {
    domains: [],
  },
}

module.exports = nextConfig