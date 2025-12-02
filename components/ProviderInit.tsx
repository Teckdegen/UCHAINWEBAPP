"use client"

import { useEffect } from "react"
import { getOrCreateUserId } from "@/lib/userId"
import { getWalletConnectClient } from "@/lib/walletConnect"

/**
 * Lightweight init component.
 *
 * Previously this also booted a custom UnchainedProvider + REST wallet API
 * connect flow. That has been removed. This now only ensures a stable
 * per-browser userId for analytics / UX purposes.
 */
export default function ProviderInit() {
  useEffect(() => {
    getOrCreateUserId()
    // Initialize WalletConnect wallet client (uses your Cloud projectId)
    getWalletConnectClient().catch((err) => {
      console.error("[Unchained][WalletConnect] init error", err)
    })
  }, [])

  return null
}

