"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createWallet, addWallet, getMnemonic } from "@/lib/wallet"
import { Eye, EyeOff, Copy } from "lucide-react"
import Image from "next/image"

type SetupMode = "menu" | "create" | "import-seed" | "import-key"

export default function SetupPage() {
  const router = useRouter()
  const [mode, setMode] = useState<SetupMode>("menu")
  const [password, setPassword] = useState("")
  const [walletName, setWalletName] = useState("")
  const [seedPhrase, setSeedPhrase] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [derivedAddress, setDerivedAddress] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [mnemonic, setMnemonic] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCreateWallet = async () => {
    if (!password || password.length < 4) {
      setError("Password must be at least 4 characters")
      return
    }

    setLoading(true)
    try {
      const wallet = await createWallet(password, walletName || "My Wallet", 1)
      addWallet(wallet) // This will automatically register userId with API
      const mnemonic = getMnemonic(wallet, password)
      setMnemonic(mnemonic || "")
      setMode("menu")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImportPrivateKey = async () => {
    if (!privateKey || !password) {
      setError("Please enter both private key and password")
      return
    }

    setLoading(true)
    try {
      // This would implement private key import logic
      setError("Private key import coming soon")
    } finally {
      setLoading(false)
    }
  }

  const proceedToDashboard = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo - CHANGE: Using the custom logo instead of icon */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Unchained Logo" width={64} height={64} className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Unchained</h1>
          <p className="text-gray-400 mt-2">Non-Custodial Web Wallet</p>
        </div>

        {/* Menu Mode */}
        {mode === "menu" && !mnemonic && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setMode("create")
                setError("")
              }}
              className="btn-primary w-full"
            >
              Create New Wallet
            </button>
            <button
              onClick={() => {
                setMode("import-seed")
                setError("")
              }}
              className="btn-secondary w-full"
            >
              Import Seed Phrase
            </button>
            <button
              onClick={() => {
                setMode("import-key")
                setError("")
              }}
              className="btn-secondary w-full"
            >
              Import Private Key
            </button>
          </div>
        )}

        {/* Create Mode */}
        {mode === "create" && !mnemonic && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Wallet Name (Optional)</label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="My Wallet"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a secure password"
                  className="input-field pr-10"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-500"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button onClick={handleCreateWallet} disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? "Creating..." : "Create Wallet"}
            </button>
            <button
              onClick={() => {
                setMode("menu")
                setError("")
              }}
              className="btn-secondary w-full"
            >
              Back
            </button>
          </div>
        )}

        {/* Mnemonic Display */}
        {mnemonic && (
          <div className="space-y-4">
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold mb-4">Save Your Seed Phrase</h2>
              <p className="text-sm text-gray-400 mb-4">
                This is your wallet backup. Store it safely - anyone with this phrase can access your wallet.
              </p>
              <div className="bg-black/50 rounded-lg p-4 mb-4 border border-green-500/20">
                <p className="text-sm text-white font-mono break-words">{mnemonic}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(mnemonic)
                }}
                className="flex items-center gap-2 text-green-500 hover:text-green-400 text-sm"
              >
                <Copy className="w-4 h-4" />
                Copy to clipboard
              </button>
            </div>
            <button onClick={proceedToDashboard} className="btn-primary w-full">
              I have saved my seed phrase
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
