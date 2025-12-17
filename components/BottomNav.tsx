"use client"

import Link from "next/link"
import { Wallet, Send, Globe, Settings, ImageIcon, Hash } from "lucide-react"
import { useState, useEffect } from "react"

interface BottomNavProps {
  active?: string
}

export default function BottomNav({ active = "dashboard" }: BottomNavProps) {
  const [chainId, setChainId] = useState(97741)

  useEffect(() => {
    // Get current chain from localStorage if available
    const stored = localStorage.getItem("selected_chain")
    if (stored) {
      setChainId(Number(stored))
    }
  }, [])

  const isActive = (page: string) => (active === page ? "text-green-500" : "text-gray-400 hover:text-green-500")

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-card rounded-t-3xl border-t border-white/10 border-b-0">
      <div className="max-w-6xl mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-0.5 transition-colors ${isActive("dashboard")}`}
          >
            <Wallet className="w-4 h-4" />
            <span className="text-[10px] font-semibold">Wallet</span>
          </Link>

          {chainId === 97741 && (
            <Link
              href="/domains"
              className={`flex flex-col items-center gap-0.5 transition-colors ${isActive("domains")}`}
            >
              <Hash className="w-4 h-4" />
              <span className="text-[10px] font-semibold">Domains</span>
            </Link>
          )}

          {chainId === 97741 && (
            <Link
              href="/browser"
              className={`flex flex-col items-center gap-0.5 transition-colors ${isActive("browser")}`}
            >
              <Globe className="w-4 h-4" />
              <span className="text-[10px] font-semibold">Browser</span>
            </Link>
          )}

          {chainId === 97741 && (
            <Link href="/nfts" className={`flex flex-col items-center gap-0.5 transition-colors ${isActive("nfts")}`}>
              <ImageIcon className="w-4 h-4" />
              <span className="text-[10px] font-semibold">NFTs</span>
            </Link>
          )}

          <Link href="/send" className={`flex flex-col items-center gap-0.5 transition-colors ${isActive("send")}`}>
            <Send className="w-4 h-4" />
            <span className="text-[10px] font-semibold">Send</span>
          </Link>

          <Link
            href="/settings"
            className={`flex flex-col items-center gap-0.5 transition-colors ${isActive("settings")}`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-[10px] font-semibold">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
