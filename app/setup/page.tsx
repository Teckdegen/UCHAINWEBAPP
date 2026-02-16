"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createWallet, addWallet, getMnemonic, importWalletFromMnemonic, importWalletFromPrivateKey, getWallets, unlockWallet } from "@/lib/wallet"
import { Eye, EyeOff, Copy } from "lucide-react"
import Image from "next/image"

type SetupMode = "menu" | "create" | "import-seed" | "import-key"

export default function SetupPage() {
  const router = useRouter()

  useEffect(() => {
    // If wallet already exists, redirect to dashboard
    const wallets = getWallets()
    if (wallets.length > 0) {
      router.push("/dashboard")
    }
  }, [router])
  const [mode, setMode] = useState<SetupMode>("menu")
  const [password, setPassword] = useState("")
  const [walletName, setWalletName] = useState("")
  const [seedPhrase, setSeedPhrase] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [derivedAddress, setDerivedAddress] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [mnemonic, setMnemonic] = useState("")
  const [quizIndices, setQuizIndices] = useState<number[]>([])
  const [quizAnswers, setQuizAnswers] = useState<string[]>([])
  const [quizError, setQuizError] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCreateWallet = async () => {
    if (!password || password.length < 4) {
      setError("Password must be exactly 4 digits")
      return
    }

    setLoading(true)
    try {
      const wallet = await createWallet(password, walletName || "My PEPU VAULT WALLET", 1)

      // Save wallet to localStorage immediately
      addWallet(wallet)

      // Verify wallet was saved by reading it back
      const savedWallets = getWallets()
      const saved = savedWallets.find(w => w.id === wallet.id)
      if (!saved) {
        throw new Error("Failed to save PEPU VAULT WALLET - PEPU VAULT WALLET not found after save")
      }

      // Auto-unlock using the same password so signing doesn't require /unlock
      unlockWallet(password)

      const mnemonic = getMnemonic(wallet, password)
      setMnemonic(mnemonic || "")

      // Prepare quiz
      if (mnemonic) {
        const words = mnemonic.split(" ")
        // Pick 3 random unique indices
        const indices = new Set<number>()
        while (indices.size < 3 && indices.size < words.length) {
          indices.add(Math.floor(Math.random() * words.length))
        }
        setQuizIndices(Array.from(indices))
        setQuizAnswers(Array.from(indices).map(() => ""))
      }
      setMode("menu")
    } catch (err: any) {
      console.error("[Setup] Error creating wallet:", err)
      setError(err.message || "Failed to create PEPU VAULT WALLET. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleImportSeed = async () => {
    if (!seedPhrase || !password) {
      setError("Please enter both seed phrase and password")
      return
    }

    setLoading(true)
    try {
      const wallet = await importWalletFromMnemonic(seedPhrase.trim(), password, walletName || "Imported PEPU VAULT WALLET", 1)

      // Save wallet to localStorage immediately
      addWallet(wallet)

      // Verify wallet was saved by reading it back
      const savedWallets = getWallets()
      const saved = savedWallets.find(w => w.id === wallet.id)
      if (!saved) {
        throw new Error("Failed to save PEPU VAULT WALLET - PEPU VAULT WALLET not found after save")
      }

      // Auto-unlock so signing doesn't require /unlock
      unlockWallet(password)
      setSeedPhrase("")
      setWalletName("")
      setPassword("")
      router.push("/dashboard")
    } catch (err: any) {
      console.error("[Setup] Error importing seed:", err)
      setError(err.message || "Failed to import seed phrase")
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
      const wallet = await importWalletFromPrivateKey(privateKey.trim(), password, walletName || "Imported PEPU VAULT WALLET", 1)

      // Save wallet to localStorage immediately
      addWallet(wallet)

      // Verify wallet was saved by reading it back
      const savedWallets = getWallets()
      const saved = savedWallets.find(w => w.id === wallet.id)
      if (!saved) {
        throw new Error("Failed to save PEPU VAULT WALLET - PEPU VAULT WALLET not found after save")
      }

      // Auto-unlock so signing doesn't require /unlock
      unlockWallet(password)
      setPrivateKey("")
      setWalletName("")
      setPassword("")
      router.push("/dashboard")
    } catch (err: any) {
      console.error("[Setup] Error importing private key:", err)
      setError(err.message || "Failed to import private key")
    } finally {
      setLoading(false)
    }
  }

  const proceedToDashboard = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-primary/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo - PEPU VAULT */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
              <Image
                src="/pepu-vault-logo.png"
                alt="PEPU VAULT Logo"
                width={80}
                height={80}
                className="w-20 h-20 relative z-10"
              />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="bg-gradient-to-r from-primary via-green-400 to-primary bg-clip-text text-transparent animate-gradient">
              PEPU VAULT
            </span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base">Non-Custodial Crypto Wallet</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50"></div>
            <span className="text-xs text-primary/70 font-mono">Secure • Private • Powerful</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50"></div>
          </div>
        </div>

        {/* Menu Mode */}
        {mode === "menu" && !mnemonic && (
          <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={() => {
                setMode("create")
                setError("")
              }}
              className="btn-primary w-full group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Wallet
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </button>
            <button
              onClick={() => {
                setMode("import-seed")
                setError("")
              }}
              className="btn-secondary w-full group"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import Seed Phrase
              </span>
            </button>
            <button
              onClick={() => {
                setMode("import-key")
                setError("")
              }}
              className="btn-secondary w-full group"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Import Private Key
              </span>
            </button>
          </div>
        )}

        {/* Create Mode */}
        {mode === "create" && !mnemonic && (
          <div className="glass-card p-6 md:p-8 space-y-5 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <h2 className="text-xl font-bold text-primary">Create Wallet</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Wallet Name (Optional)</label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="My Wallet"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">4-Digit PIN</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a secure 4-digit PIN"
                  maxLength={4}
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="glass-card p-3 border border-primary/30 bg-primary/5">
                <p className="text-primary text-sm font-mono">{error}</p>
              </div>
            )}
            <button onClick={handleCreateWallet} disabled={loading} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : "Create Wallet"}
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

        {/* Import Seed Phrase */}
        {mode === "import-seed" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">PEPU VAULT WALLET Name (Optional)</label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="My Imported PEPU VAULT WALLET"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Seed Phrase</label>
              <textarea
                value={seedPhrase}
                onChange={(e) => setSeedPhrase(e.target.value)}
                placeholder="Enter your 12 or 24 word seed phrase"
                className="input-field min-h-[100px]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Passcode (4 digits)</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={4}
                placeholder="Enter a 4-digit passcode"
                className="input-field"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button onClick={handleImportSeed} disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? "Importing..." : "Import Seed Phrase"}
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

        {/* Import Private Key */}
        {mode === "import-key" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">PEPU VAULT WALLET Name (Optional)</label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="My Imported PEPU VAULT WALLET"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Private Key</label>
              <textarea
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="Enter your private key"
                className="input-field min-h-[80px]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Passcode (4 digits)</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={4}
                placeholder="Enter a 4-digit passcode"
                className="input-field"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={handleImportPrivateKey}
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Importing..." : "Import Private Key"}
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

        {/* Mnemonic Display + Backup Quiz */}
        {mnemonic && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="glass-card p-6 md:p-8 border-2 border-primary/30">
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-7 h-7 text-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h2 className="text-xl md:text-2xl font-bold text-primary">Secure Your Wallet</h2>
              </div>
              <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-300 mb-3 font-medium">
                  ⚠️ Write down your recovery phrase and keep it in a safe place. Never share it with anyone!
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {mnemonic.split(" ").map((word, index) => (
                    <div key={index} className="bg-black/60 backdrop-blur-sm border border-primary/10 rounded-lg px-3 py-2 hover:border-primary/30 transition-all group">
                      <span className="text-[10px] text-gray-500 font-mono">{index + 1}.</span>
                      <span className="ml-2 text-sm text-white font-medium group-hover:text-primary transition-colors">{word}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(mnemonic)
                }}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-semibold text-sm transition-all group"
              >
                <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Copy to Clipboard
              </button>
            </div>
            {quizIndices.length > 0 && (
              <div className="glass-card p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-bold text-lg text-primary">Verify Your Backup</h3>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Enter the correct words from your seed phrase to confirm you've saved it securely.
                </p>
                {quizIndices.map((index, i) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Word #{index + 1}</label>
                    <input
                      type="text"
                      value={quizAnswers[i] || ""}
                      onChange={(e) => {
                        const next = [...quizAnswers]
                        next[i] = e.target.value
                        setQuizAnswers(next)
                        setQuizError("")
                      }}
                      className="input-field"
                      placeholder={`Enter word #${index + 1}`}
                    />
                  </div>
                ))}
                {quizError && (
                  <div className="glass-card p-3 border border-primary/30 bg-primary/5">
                    <p className="text-primary text-sm font-mono">{quizError}</p>
                  </div>
                )}
                <button
                  onClick={() => {
                    const words = mnemonic.split(" ")
                    const allCorrect = quizIndices.every((idx, i) => {
                      return (quizAnswers[i] || "").trim().toLowerCase() === words[idx].toLowerCase()
                    })
                    if (!allCorrect) {
                      setQuizError("Incorrect words. Please check your seed phrase and try again.")
                      return
                    }
                    proceedToDashboard()
                  }}
                  className="btn-primary w-full"
                >
                  Continue to Wallet
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
