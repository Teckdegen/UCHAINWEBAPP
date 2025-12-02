/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /**
   * Transpile WalletConnect packages to handle any compatibility issues.
   * These packages are loaded via dynamic imports (client-side only) to
   * avoid Turbopack parsing test files during SSR.
   */
  transpilePackages: [
    "@walletconnect/sign-client",
    "@walletconnect/utils",
    "@walletconnect/logger",
  ],
}

export default nextConfig
