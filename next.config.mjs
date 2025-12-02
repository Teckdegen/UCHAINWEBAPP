/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /**
   * Disable Turbopack and use webpack instead.
   * This allows us to externalize WalletConnect packages to prevent
   * build errors from thread-stream test files.
   */
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Externalize WalletConnect packages on client-side
      // This prevents webpack from bundling them and analyzing test files
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
