"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getWalletState } from "@/lib/wallet"
import { getUnchainedProvider, type ConnectedDApp } from "@/lib/provider"
import { Trash2, ExternalLink, Plus } from "lucide-react"
import Link from "next/link"
import BottomNav from "@/components/BottomNav"

export default function DAppsPage() {
  const router = useRouter()
  const [connectedDApps, setConnectedDApps] = useState<ConnectedDApp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const state = getWalletState()
    if (state.isLocked) {
      router.push("/unlock")
      return
    }

    const provider = getUnchainedProvider()
    setConnectedDApps(provider.getConnectedDApps())
    setLoading(false)
  }, [router])

  const handleDisconnect = (id: string) => {
    const provider = getUnchainedProvider()
    provider.removeConnectedDApp(id)
    setConnectedDApps(provider.getConnectedDApps())
  }

  const handleAddDApp = (origin: string, name: string) => {
    const provider = getUnchainedProvider()
    provider.addConnectedDApp(origin, name)
    setConnectedDApps(provider.getConnectedDApps())
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="glass-card rounded-none p-6 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Connected Apps</h1>
            <p className="text-sm text-gray-400">Manage your wallet connections</p>
          </div>
          <Link
            href="/browser"
            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Browse Apps
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : connectedDApps.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-gray-400 mb-4">No connected apps yet</p>
            <Link
              href="/browser"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-bold rounded-xl transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Explore Apps
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 mb-4">{connectedDApps.length} Connected</h2>
            {connectedDApps.map((dapp) => (
              <div
                key={dapp.id}
                className="glass-card p-4 flex items-center justify-between hover:bg-white/10 transition-all"
              >
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{dapp.name}</h3>
                  <p className="text-xs text-gray-400 break-all">{dapp.origin}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Connected {new Date(dapp.connectedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={dapp.origin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Open App"
                  >
                    <ExternalLink className="w-5 h-5 text-blue-400" />
                  </a>
                  <button
                    onClick={() => handleDisconnect(dapp.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Disconnect"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="dapps" />
    </div>
  )
}
