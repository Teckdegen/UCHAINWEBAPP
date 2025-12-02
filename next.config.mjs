/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /**
   * Turbopack configuration for Next.js 16.
   * WalletConnect SDK is loaded via dynamic imports (client-side only),
   * so we don't need to externalize packages here. Turbopack should handle
   * the dynamic imports correctly.
   */
  experimental: {
    // Empty turbopack config to explicitly use Turbopack
    turbo: {},
  },
}

export default nextConfig
