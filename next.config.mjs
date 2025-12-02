/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /**
   * Externalize WalletConnect packages to prevent Turbopack from analyzing
   * problematic dependencies (thread-stream test files).
   * These packages are loaded at runtime via dynamic imports.
   */
  serverComponentsExternalPackages: [
    '@walletconnect/sign-client',
    '@walletconnect/utils',
    '@walletconnect/logger',
    'pino',
    'thread-stream',
  ],
  /**
   * Use webpack to ignore problematic test files in thread-stream.
   * This prevents build errors from non-code assets in WalletConnect dependencies.
   */
  webpack: (config, { webpack }) => {
    // Ignore test files and non-code assets in thread-stream
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /thread-stream\/test/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /thread-stream\/bench/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /\.md$/,
        contextRegExp: /thread-stream/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /\.zip$/,
        contextRegExp: /thread-stream/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /\.sh$/,
        contextRegExp: /thread-stream/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /\.yml$/,
        contextRegExp: /thread-stream/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /LICENSE$/,
        contextRegExp: /thread-stream/,
      })
    )
    return config
  },
}

export default nextConfig
