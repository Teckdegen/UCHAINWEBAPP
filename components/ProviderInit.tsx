"use client"

import { useEffect } from "react"
import { getOrCreateUserId } from "@/lib/userId"
import { getWalletState, lockWallet } from "@/lib/wallet"

/**
 * Initializes global providers and services.
 * - User ID for analytics
 * - WalletConnect SignClient for dApp connections (client-side only)
 * - Auto-lock wallet on page reload
 */
export default function ProviderInit() {
  useEffect(() => {
    // Always lock wallet on page reload/mount
    // This ensures security - wallet must be unlocked again after any page reload
    if (typeof window !== "undefined") {
      const state = getWalletState()
      // Lock wallet if it's not already locked
      // This will also clear the session password
      if (!state.isLocked) {
        lockWallet()
      }
      
      // Also clear session password directly as a safety measure
      sessionStorage.removeItem("unchained_session_password")
    }

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

