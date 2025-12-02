/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /**
   * Externalize packages that use Node.js built-ins like worker_threads.
   * This prevents Turbopack from trying to bundle them.
   */
  experimental: {
    serverComponentsExternalPackages: [
      '@walletconnect/sign-client',
      '@walletconnect/utils',
      '@walletconnect/logger',
      'pino',
      'thread-stream',
    ],
  },
  /**
   * Add empty turbopack config to silence the warning about webpack config.
   * WalletConnect packages are loaded via dynamic imports client-side only
   * to avoid Turbopack analyzing problematic dependencies during build.
   */
  turbopack: {},
}

export default nextConfig
