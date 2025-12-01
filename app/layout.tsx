"use client"

import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import ProviderInit from "@/components/ProviderInit"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { wagmiConfig } from "@/lib/wagmi"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Unchained Web Wallet",
  description: "Non-custodial crypto wallet for ETH and PEPU",
  icons: {
    icon: "/logo.png",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const queryClient = new QueryClient()

  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${geist.className} bg-black text-white h-full w-full`}>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <ProviderInit />
            {children}
            <Analytics />
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}
