/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /**
   * Externalize problematic packages to avoid Turbopack parsing issues.
   * WalletConnect's dependencies (pino, thread-stream) contain test files
   * that Turbopack tries to parse. By externalizing them, we let Node.js
   * handle them at runtime instead of bundling them.
   */
  serverComponentsExternalPackages: [
    "@walletconnect/sign-client",
    "pino",
    "thread-stream",
  ],
  /**
   * Use webpack for WalletConnect packages to avoid Turbopack issues.
   * This ensures problematic dependencies are handled by webpack's
   * more mature module resolution.
   */
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side: externalize problematic packages
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

export default nextConfig
