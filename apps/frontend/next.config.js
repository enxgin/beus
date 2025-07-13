/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  transpilePackages: [],
  images: {
    domains: [],
  },
  server: {
    hostname: '0.0.0.0',
    port: 3000,
  },
}

module.exports = nextConfig