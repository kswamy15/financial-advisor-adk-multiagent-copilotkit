/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['thread-stream', 'pino', 'pino-pretty'],
}

module.exports = nextConfig
