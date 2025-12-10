"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getWallets, getCurrentWallet } from "@/lib/wallet"
import {
  checkDomainAvailability,
  getDomainRegistrationFee,
  getDomainInfo,
  getDomainStatus,
  validateDomainName,
  registerDomain,
  getDomainByWallet,
} from "@/lib/domains"
import { getTokenBalance } from "@/lib/rpc"
import { Search, Loader, CheckCircle, XCircle, Globe } from "lucide-react"
import BottomNav from "@/components/BottomNav"

const USDC_ADDRESS = "0x20fB684Bfc1aBAaD3AceC5712f2Aa30bd494dF74"
const PEPU_CHAIN_ID = 97741

export default function DomainsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [domainStatus, setDomainStatus] = useState<any>(null)
  const [registrationFee, setRegistrationFee] = useState<string>("0")
  const [years, setYears] = useState(1)
  const [loadingFee, setLoadingFee] = useState(false)
  const [usdcBalance, setUsdcBalance] = useState("0")
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [registering, setRegistering] = useState(false)
  const [password, setPassword] = useState("")
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [userDomain, setUserDomain] = useState<string | null>(null)
  const [userDomainInfo, setUserDomainInfo] = useState<any>(null)
  const [loadingUserDomain, setLoadingUserDomain] = useState(false)

  useEffect(() => {
    const wallets = getWallets()
    if (wallets.length === 0) {
      router.push("/setup")
      return
    }

    loadUserDomain()
    loadUsdcBalance()
  }, [router])

  const loadUserDomain = async () => {
    try {
      setLoadingUserDomain(true)
      const wallets = getWallets()
      if (wallets.length === 0) return

      const wallet = getCurrentWallet() || wallets[0]
      const domain = await getDomainByWallet(wallet.address)
      
      if (domain) {
        setUserDomain(domain)
        const parsed = domain.replace(".pepu", "")
        const info = await getDomainInfo(parsed, ".pepu")
        setUserDomainInfo(info)
      }
    } catch (error) {
      console.error("Error loading user domain:", error)
    } finally {
      setLoadingUserDomain(false)
    }
  }

  const loadUsdcBalance = async () => {
    try {
      setLoadingBalance(true)
      const wallets = getWallets()
      if (wallets.length === 0) return

      const wallet = getCurrentWallet() || wallets[0]
      const balance = await getTokenBalance(USDC_ADDRESS, wallet.address, PEPU_CHAIN_ID)
      setUsdcBalance(balance)
    } catch (error) {
      console.error("Error loading USDC balance:", error)
    } finally {
      setLoadingBalance(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a domain name")
      return
    }

    // Remove .pepu if user included it
    const domainName = searchQuery.trim().toLowerCase().replace(".pepu", "")

    // Validate domain name format
    if (!/^[a-z0-9-]{1,63}$/.test(domainName)) {
      setError("Invalid domain name. Use only letters, numbers, and hyphens (1-63 characters)")
      setIsAvailable(null)
      setDomainStatus(null)
      setShowRegisterForm(false)
      return
    }

    setIsChecking(true)
    setError("")
    setSuccess("")
    setShowRegisterForm(false)

    try {
      const isValid = await validateDomainName(domainName)
      if (!isValid) {
        setError("Invalid domain name format")
        setIsAvailable(null)
        setDomainStatus(null)
        return
      }

      const available = await checkDomainAvailability(domainName, ".pepu")
      setIsAvailable(available)

      if (available) {
        const status = await getDomainStatus(domainName, ".pepu")
        setDomainStatus(status)
        setShowRegisterForm(true)
        await updateFee(domainName, years)
      } else {
        // Domain exists, get its info
        const info = await getDomainInfo(domainName, ".pepu")
        if (info) {
          setDomainStatus({
            exists: true,
            expired: Date.now() / 1000 >= info.expiryTimestamp,
            remainingDays: info.expiryTimestamp > Date.now() / 1000
              ? Math.floor((info.expiryTimestamp - Date.now() / 1000) / 86400)
              : 0,
          })
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to check domain availability")
      setIsAvailable(null)
      setDomainStatus(null)
    } finally {
      setIsChecking(false)
    }
  }

  const updateFee = async (domainName: string, yearsValue: number) => {
    if (!domainName || yearsValue < 1 || yearsValue > 60) return

    setLoadingFee(true)
    try {
      const fee = await getDomainRegistrationFee(domainName, yearsValue, ".pepu")
      setRegistrationFee(fee)
    } catch (err: any) {
      console.error("Error calculating fee:", err)
    } finally {
      setLoadingFee(false)
    }
  }

  useEffect(() => {
    if (showRegisterForm && searchQuery.trim() && isAvailable) {
      const domainName = searchQuery.trim().toLowerCase().replace(".pepu", "")
      updateFee(domainName, years)
    }
  }, [years, showRegisterForm, searchQuery, isAvailable])

  const handleRegister = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a domain name")
      return
    }

    if (!password) {
      setError("Please enter your password")
      return
    }

    if (years < 1 || years > 60) {
      setError("Please select a valid number of years (1-60)")
      return
    }

    const domainName = searchQuery.trim().toLowerCase().replace(".pepu", "")

    setRegistering(true)
    setError("")
    setSuccess("")

    try {
      const wallets = getWallets()
      if (wallets.length === 0) throw new Error("No wallet found")

      const wallet = getCurrentWallet() || wallets[0]

      // Check USDC balance
      const balance = await getTokenBalance(USDC_ADDRESS, wallet.address, PEPU_CHAIN_ID)
      if (Number.parseFloat(balance) < Number.parseFloat(registrationFee)) {
        throw new Error(
          `Insufficient USDC balance. Required: ${Number.parseFloat(registrationFee).toFixed(2)} USDC, Available: ${Number.parseFloat(balance).toFixed(2)} USDC`
        )
      }

      const txHash = await registerDomain(wallet, password, domainName, years, ".pepu")
      
      setSuccess(`Domain registered successfully! Transaction: https://pepuscan.com/tx/${txHash}`)
      setPassword("")
      setSearchQuery("")
      setShowRegisterForm(false)
      setIsAvailable(null)
      setDomainStatus(null)
      
      // Reload user domain and balance
      await loadUserDomain()
      await loadUsdcBalance()

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/dashboard")
      }, 3000)
    } catch (err: any) {
      setError(err.message || "Failed to register domain")
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-none p-6 border-b border-white/10 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Register Domain</h1>
              <p className="text-sm text-gray-400">Get your .pepu domain name</p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8 space-y-6">
          {/* User's Existing Domain */}
          {loadingUserDomain ? (
            <div className="glass-card p-6 text-center">
              <Loader className="w-5 h-5 animate-spin mx-auto text-green-500" />
              <p className="text-sm text-gray-400 mt-2">Loading your domain...</p>
            </div>
          ) : userDomain && userDomainInfo ? (
            <div className="glass-card p-6 border border-green-500/30 bg-green-500/10">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-bold">Your Domain</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Domain Name</p>
                  <p className="text-lg font-semibold text-green-400">{userDomain}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Wallet Address</p>
                    <p className="text-sm font-mono break-all">{userDomainInfo.walletAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Owner</p>
                    <p className="text-sm font-mono break-all">{userDomainInfo.owner}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Registration Date</p>
                    <p className="text-sm">
                      {new Date(userDomainInfo.registrationTimestamp * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Expiry Date</p>
                    <p className="text-sm">
                      {new Date(userDomainInfo.expiryTimestamp * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Time Remaining</p>
                  <p className="text-sm">
                    {userDomainInfo.expiryTimestamp > Date.now() / 1000
                      ? `${Math.floor((userDomainInfo.expiryTimestamp - Date.now() / 1000) / 86400)} days`
                      : "Expired"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Search Bar */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Search Domain</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setIsAvailable(null)
                    setDomainStatus(null)
                    setShowRegisterForm(false)
                    setError("")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch()
                    }
                  }}
                  placeholder="Enter domain name (e.g., myname)"
                  className="input-field pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <button
                onClick={handleSearch}
                disabled={isChecking || !searchQuery.trim()}
                className="btn-primary px-6 disabled:opacity-50 flex items-center gap-2"
              >
                {isChecking ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Domain will be registered as: {searchQuery || "..."}.pepu</p>
          </div>

          {/* Availability Status */}
          {isAvailable !== null && (
            <div
              className={`glass-card p-4 border ${
                isAvailable
                  ? "border-green-500/50 bg-green-500/10"
                  : "border-red-500/50 bg-red-500/10"
              }`}
            >
              <div className="flex items-center gap-2">
                {isAvailable ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="font-semibold text-green-400">
                        {searchQuery.replace(".pepu", "")}.pepu is available!
                      </p>
                      {domainStatus && (
                        <p className="text-xs text-gray-400 mt-1">
                          Base fee: {Number.parseFloat(domainStatus.fee).toFixed(2)} USDC per year
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="font-semibold text-red-400">
                        {searchQuery.replace(".pepu", "")}.pepu is not available
                      </p>
                      {domainStatus && domainStatus.exists && (
                        <p className="text-xs text-gray-400 mt-1">
                          {domainStatus.expired
                            ? "This domain has expired"
                            : `Registered for ${domainStatus.remainingDays} more days`}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Registration Form */}
          {showRegisterForm && isAvailable && (
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-lg font-bold">Register Domain</h3>

              {/* Years Selector */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Registration Period (Years)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={years}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value) || 1
                      setYears(Math.max(1, Math.min(60, value)))
                    }}
                    className="input-field flex-1"
                  />
                  <div className="flex gap-1">
                    {[1, 5, 10, 20, 60].map((y) => (
                      <button
                        key={y}
                        onClick={() => setYears(y)}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                          years === y
                            ? "bg-green-500 text-black"
                            : "bg-white/10 text-gray-400 hover:bg-white/20"
                        }`}
                      >
                        {y}y
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fee Display */}
              <div className="glass-card p-4 bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Registration Fee</span>
                  {loadingFee ? (
                    <Loader className="w-4 h-4 animate-spin text-green-400" />
                  ) : (
                    <span className="text-lg font-bold text-green-400">
                      {Number.parseFloat(registrationFee).toFixed(2)} USDC
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>USDC Balance</span>
                  {loadingBalance ? (
                    <Loader className="w-3 h-3 animate-spin" />
                  ) : (
                    <span>{Number.parseFloat(usdcBalance).toFixed(2)} USDC</span>
                  )}
                </div>
                {Number.parseFloat(usdcBalance) < Number.parseFloat(registrationFee) && (
                  <p className="text-xs text-red-400 mt-2">
                    Insufficient USDC balance. You need{" "}
                    {(Number.parseFloat(registrationFee) - Number.parseFloat(usdcBalance)).toFixed(2)} more USDC.
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your wallet password"
                  className="input-field"
                />
              </div>

              {/* Register Button */}
              <button
                onClick={handleRegister}
                disabled={
                  registering ||
                  !password ||
                  Number.parseFloat(usdcBalance) < Number.parseFloat(registrationFee)
                }
                className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {registering ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    Register {searchQuery.replace(".pepu", "")}.pepu
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="glass-card p-4 border border-red-500/50 bg-red-500/10">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="glass-card p-4 border border-green-500/50 bg-green-500/10">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav active="domains" />
    </div>
  )
}

