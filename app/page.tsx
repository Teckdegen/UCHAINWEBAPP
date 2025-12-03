"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getWallets, getWalletState, lockWallet } from "@/lib/wallet"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Wallet is already locked by ProviderInit on page reload
    // Just check state and redirect accordingly
    const wallets = getWallets()
    const state = getWalletState()

    if (wallets.length === 0) {
      router.push("/setup")
    } else if (state.isLocked) {
      router.push("/unlock")
    } else {
      router.push("/dashboard")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-gray-400">Loading wallet...</p>
      </div>
    </div>
  )
}
