import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { AppProviders } from "@/components/AppProviders"
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
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${geist.className} bg-black text-white h-full w-full`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
