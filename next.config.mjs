/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /**
   * Use webpack to externalize WalletConnect packages.
   * This prevents Turbopack from analyzing them during build.
   * They will be loaded at runtime via dynamic imports.
   */
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Externalize WalletConnect packages on client-side
      config.externals = config.externals || []
      config.externals.push({
        '@walletconnect/sign-client': 'commonjs @walletconnect/sign-client',
        '@walletconnect/utils': 'commonjs @walletconnect/utils',
        '@walletconnect/logger': 'commonjs @walletconnect/logger',
        'pino': 'commonjs pino',
        'thread-stream': 'commonjs thread-stream',
      })
    }
    return config
  },
}

export default nextConfig
