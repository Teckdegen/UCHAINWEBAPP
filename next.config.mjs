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
   * This allows us to use IgnorePlugin to skip problematic test files
   * in thread-stream (WalletConnect dependency).
   */
  experimental: {
    turbo: false,
  },
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
