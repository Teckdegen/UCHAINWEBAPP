/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /**
   * Add empty turbopack config to silence the warning about webpack config.
   * WalletConnect packages are loaded via dynamic imports client-side only
   * to avoid Turbopack analyzing problematic dependencies during build.
   */
  turbopack: {},
}

export default nextConfig
