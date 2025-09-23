/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
    optimizeCss: true,
  },
  compress: true,
  poweredByHeader: false,
  // Enable modern JavaScript features
  modularizeImports: {
    'date-fns': {
      transform: 'date-fns/{{member}}',
    },
  },
}

export default nextConfig
