/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['static.wixstatic.com'],
  },
}

module.exports = {
  transpilePackages: ['framer-motion'],
  // ... other Next.js config options
}