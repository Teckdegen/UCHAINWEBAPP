"use client"

import { useEffect } from "react"
import { getOrCreateUserId } from "@/lib/userId"

/**
 * Initializes global providers and services.
 * - User ID for analytics
 * - WalletConnect SignClient for dApp connections (client-side only)
 */
export default function ProviderInit() {
  useEffect(() => {
    getOrCreateUserId()
    
    // Initialize WalletConnect client (client-side only, no SSR)
    // Use setTimeout to ensure this runs after hydration
    if (typeof window !== "undefined") {
      setTimeout(() => {
        import("@/lib/walletConnect")
          .then((mod) => mod.initWalletConnect())
          .catch((error) => {
            console.error("[ProviderInit] Failed to initialize WalletConnect:", error)
          })
      }, 0)
    }
  }, [])

  return null
}

