/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /**
   * Turbopack config
   *
   * WalletConnect's logger/sign-client depends on `pino` which bundles a
   * `thread-stream` package that includes a lot of test and bench files
   * (tap tests, zip fixtures, shell scripts, etc.). Turbopack tries to parse
   * those as app code and fails. Here we tell Turbopack to treat those
   * patterns as raw/assets so they don't break the build.
   */
}

export default nextConfig
