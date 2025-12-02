"use client"

import { useEffect } from "react"
import { getOrCreateUserId } from "@/lib/userId"
import { initWalletConnect } from "@/lib/walletConnect"

/**
 * Initializes global providers and services.
 * - User ID for analytics
 * - WalletConnect SignClient for dApp connections
 */
export default function ProviderInit() {
  useEffect(() => {
    getOrCreateUserId()
    
    // Initialize WalletConnect client (client-side only)
    initWalletConnect().catch((error) => {
      console.error("[ProviderInit] Failed to initialize WalletConnect:", error)
    })
  }, [])

  return null
}

