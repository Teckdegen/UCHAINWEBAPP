import { ethers } from "ethers"
import CryptoJS from "crypto-js"
import { getOrCreateUserId } from "./userId"
export interface Wallet {
  id: string
  address: string
  encryptedPrivateKey: string
  encryptedMnemonic?: string
  createdAt: number
  name?: string
  chainId: number
  derivationIndex?: number
}

const WALLETS_KEY = "unchained_wallets"
const WALLET_STATE_KEY = "unchained_wallet_state"
const AUTO_LOCK_KEY = "unchained_auto_lock_seconds"
const CURRENT_WALLET_ID_KEY = "unchained_current_wallet_id"

export function generateWalletId() {
  return Math.random().toString(36).substring(2, 15)
}

export async function createWallet(password: string, name?: string, chainId = 1): Promise<Wallet> {
  const wallet = ethers.Wallet.createRandom()
  const mnemonic = wallet.mnemonic?.phrase || ""

  const encryptedPrivateKey = encryptData(wallet.privateKey, password)
  const encryptedMnemonic = mnemonic ? encryptData(mnemonic, password) : undefined

  return {
    id: generateWalletId(),
    address: wallet.address,
    encryptedPrivateKey,
    encryptedMnemonic,
    createdAt: Date.now(),
    name: name || `Wallet ${new Date().toLocaleDateString()}`,
    chainId,
  }
}

export async function importWalletFromMnemonic(
  seedPhrase: string,
  password: string,
  name?: string,
  chainId = 1,
): Promise<Wallet> {
  const wallet = ethers.Wallet.fromPhrase(seedPhrase)
  const mnemonic = wallet.mnemonic?.phrase || seedPhrase

  const encryptedPrivateKey = encryptData(wallet.privateKey, password)
  const encryptedMnemonic = mnemonic ? encryptData(mnemonic, password) : undefined

  return {
    id: generateWalletId(),
    address: wallet.address,
    encryptedPrivateKey,
    encryptedMnemonic,
    createdAt: Date.now(),
    name: name || `Imported Wallet ${new Date().toLocaleDateString()}`,
    chainId,
  }
}

export async function importWalletFromPrivateKey(
  privateKey: string,
  password: string,
  name?: string,
  chainId = 1,
): Promise<Wallet> {
  let cleaned = privateKey.trim()
  if (!cleaned.startsWith("0x")) {
    cleaned = "0x" + cleaned
  }

  const wallet = new ethers.Wallet(cleaned)

  const encryptedPrivateKey = encryptData(wallet.privateKey, password)

  return {
    id: generateWalletId(),
    address: wallet.address,
    encryptedPrivateKey,
    encryptedMnemonic: undefined,
    createdAt: Date.now(),
    name: name || `Imported Wallet ${new Date().toLocaleDateString()}`,
    chainId,
  }
}

export function encryptData(data: string, password: string): string {
  return CryptoJS.AES.encrypt(data, password).toString()
}

export function decryptData(encryptedData: string, password: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, password)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    
    // If decryption returns empty string, the password is likely wrong
    // But also check if the encrypted data itself is malformed
    if (!decrypted || decrypted.length === 0) {
      // Try to see if we can get any data at all
      const hexString = bytes.toString(CryptoJS.enc.Hex)
      if (!hexString || hexString.length === 0) {
        throw new Error("Decryption failed - invalid encrypted data or incorrect password")
      }
      // If we got hex but no UTF-8, password might be wrong
      throw new Error("Decryption failed - incorrect password")
    }
    
    return decrypted
  } catch (error: any) {
    // Re-throw with clearer message
    if (error.message && error.message.includes("password")) {
      throw error
    }
    throw new Error("Decryption failed - incorrect password or corrupted data")
  }
}

export function addWallet(wallet: Wallet) {
  const wallets = getWallets()
  wallets.push(wallet)
  saveWallets(wallets)

  // If no current wallet is set, make this the active one
  if (typeof window !== "undefined") {
    const currentId = localStorage.getItem(CURRENT_WALLET_ID_KEY)
    if (!currentId) {
      localStorage.setItem(CURRENT_WALLET_ID_KEY, wallet.id)
    }
  }
}

export function getWallets(): Wallet[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(WALLETS_KEY)
  return stored ? JSON.parse(stored) : []
}

export function saveWallets(wallets: Wallet[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets))
}

export function getWalletState() {
  if (typeof window === "undefined") return { isLocked: true, lastActivity: 0 }
  const stored = localStorage.getItem(WALLET_STATE_KEY)
  const state = stored ? JSON.parse(stored) : { isLocked: true, lastActivity: 0 }

  // Auto-lock based on inactivity
  const autoLockSeconds = getAutoLockSeconds()
  if (!state.isLocked && state.lastActivity && autoLockSeconds > 0) {
    const now = Date.now()
    if (now - state.lastActivity > autoLockSeconds * 1000) {
      state.isLocked = true
      saveWalletState(state)
    }
  }

  return state
}

export function saveWalletState(state: any) {
  if (typeof window === "undefined") return
  localStorage.setItem(WALLET_STATE_KEY, JSON.stringify(state))
}

const SESSION_PASSWORD_KEY = "unchained_session_password"
const PERSIST_PASSWORD_KEY = "unchained_persist_password"

export function lockWallet() {
  const state = getWalletState()
  state.isLocked = true
  saveWalletState(state)
  // Clear session password when locking
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_PASSWORD_KEY)
    // Also clear any other session data that might be related
    // This ensures a clean lock state
  }
}

export function unlockWallet(password: string): boolean {
  const wallets = getWallets()
  if (wallets.length === 0) return false

  try {
    const testWallet = wallets[0]
    decryptData(testWallet.encryptedPrivateKey, password)
    const state = getWalletState()
    state.isLocked = false
    state.lastActivity = Date.now()
    saveWalletState(state)
    // Store password in sessionStorage (and persist copy) for signing
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_PASSWORD_KEY, password)
      localStorage.setItem(PERSIST_PASSWORD_KEY, password)
    }
    return true
  } catch {
    return false
  }
}

// Get password from session storage (for transactions)
export function getSessionPassword(): string | null {
  if (typeof window === "undefined") return null
  // Prefer session password, but fall back to persisted password so
  // signing can work without visiting /unlock first.
  const session = sessionStorage.getItem(SESSION_PASSWORD_KEY)
  if (session) return session
  return localStorage.getItem(PERSIST_PASSWORD_KEY)
}

export function getPrivateKey(wallet: Wallet, password: string): string {
  try {
    const decrypted = decryptData(wallet.encryptedPrivateKey, password)
    
    // Validate decrypted result - check if it's empty or just whitespace
    if (!decrypted || typeof decrypted !== 'string') {
      throw new Error("Failed to decrypt private key. The password may be incorrect.")
    }
    
    const trimmed = decrypted.trim()
    if (trimmed.length === 0) {
      throw new Error("Failed to decrypt private key. The password may be incorrect.")
    }
    
    // Ensure private key has 0x prefix
    let cleaned = trimmed
    if (!cleaned.startsWith("0x")) {
      cleaned = "0x" + cleaned
    }
    
    // Validate private key format by trying to create a wallet
    // Only throw error if it's clearly invalid, not if it's just a validation issue
    try {
      const testWallet = new ethers.Wallet(cleaned)
      // Verify the wallet address matches (this confirms the private key is correct)
      if (testWallet.address.toLowerCase() !== wallet.address.toLowerCase()) {
        throw new Error("Decrypted private key does not match wallet address. The password may be incorrect.")
      }
    } catch (validationError: any) {
      // If it's a format error, it might be a password issue
      // But if it's an address mismatch, definitely password issue
      if (validationError.message.includes("address") || validationError.message.includes("match")) {
        throw new Error("Incorrect password. Please try again.")
      }
      // For other validation errors, still try to use it (might be a false positive)
      // Only throw if it's clearly a format issue
      if (validationError.message.includes("invalid") || validationError.message.includes("length")) {
        throw new Error("Incorrect password. Please try again.")
      }
      // Otherwise, log the error but continue - might be a false positive
      console.warn("[Wallet] Validation warning:", validationError.message)
    }
    
    return cleaned
  } catch (error: any) {
    // Re-throw with clearer message only if it's clearly a password issue
    const errorMsg = error.message || ""
    if (errorMsg.includes("password") || errorMsg.includes("decrypt") || errorMsg.includes("incorrect")) {
      throw new Error("Incorrect password. Please try again.")
    }
    // For other errors, throw the original error
    throw error
  }
}

export function getMnemonic(wallet: Wallet, password: string): string | undefined {
  if (!wallet.encryptedMnemonic) return undefined
  return decryptData(wallet.encryptedMnemonic, password)
}

export function updateActivity() {
  const state = getWalletState()
  state.lastActivity = Date.now()
  saveWalletState(state)
}

export function getAutoLockSeconds(): number {
  if (typeof window === "undefined") return 60
  const stored = localStorage.getItem(AUTO_LOCK_KEY)
  const parsed = stored ? Number.parseInt(stored, 10) : 60
  return Number.isNaN(parsed) ? 60 : parsed
}

export function setAutoLockSeconds(seconds: number) {
  if (typeof window === "undefined") return
  const safe = Math.max(0, seconds)
  localStorage.setItem(AUTO_LOCK_KEY, safe.toString())
}

export function getCurrentWalletId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(CURRENT_WALLET_ID_KEY)
}

export function setCurrentWalletId(id: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(CURRENT_WALLET_ID_KEY, id)
}

export function getCurrentWallet(): Wallet | null {
  const wallets = getWallets()
  if (wallets.length === 0) return null
  if (typeof window === "undefined") return wallets[0]

  const currentId = localStorage.getItem(CURRENT_WALLET_ID_KEY)
  if (!currentId) return wallets[0]

  return wallets.find((w) => w.id === currentId) || wallets[0]
}

export function deleteWallet(id: string) {
  const wallets = getWallets()
  if (wallets.length <= 1) {
    throw new Error("Cannot delete the only wallet")
  }

  const index = wallets.findIndex((w) => w.id === id)
  if (index === -1) return

  // Prevent deleting the primary (first) wallet
  if (index === 0) {
    throw new Error("Cannot delete the primary wallet")
  }

  wallets.splice(index, 1)
  saveWallets(wallets)

  // If we deleted the active wallet, fall back to the first remaining
  if (typeof window !== "undefined") {
    const currentId = localStorage.getItem(CURRENT_WALLET_ID_KEY)
    if (currentId === id) {
      localStorage.setItem(CURRENT_WALLET_ID_KEY, wallets[0].id)
    }
  }
}

export async function createWalletFromExistingMnemonic(
  password: string,
  baseWalletId?: string,
  chainId = 1,
): Promise<Wallet> {
  const wallets = getWallets()
  if (wallets.length === 0) {
    throw new Error("No wallet found to derive from")
  }

  const baseWallet =
    wallets.find((w) => w.id === baseWalletId && w.encryptedMnemonic) ||
    wallets.find((w) => w.encryptedMnemonic)

  if (!baseWallet || !baseWallet.encryptedMnemonic) {
    throw new Error("No seed phrase available to derive new wallet")
  }

  // Decrypt mnemonic with existing passcode
  const mnemonic = getMnemonic(baseWallet, password)
  if (!mnemonic) {
    throw new Error("Failed to decrypt seed phrase")
  }

  // Derive next index from this mnemonic (HD wallet style)
  // We group wallets by the *actual* mnemonic text (encryption output can differ)
  const relatedWallets = wallets.filter((w) => {
    if (!w.encryptedMnemonic) return false
    try {
      const walletMnemonic = getMnemonic(w, password)
      return walletMnemonic === mnemonic
    } catch {
      return false
    }
  })
  const maxIndex = relatedWallets.reduce((max, w) => {
    if (typeof w.derivationIndex === "number") {
      return Math.max(max, w.derivationIndex)
    }
    // Root wallet without explicit index -> treat as index 0
    return Math.max(max, 0)
  }, -1)

  const nextIndex = maxIndex + 1

  const path = `m/44'/60'/0'/0/${nextIndex}`
  // Ethers v6: use HDNodeWallet to derive from path
  const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic)
  const child = hdNode.derivePath(path)

  const encryptedPrivateKey = encryptData(child.privateKey, password)

  return {
    id: generateWalletId(),
    address: child.address,
    encryptedPrivateKey,
    encryptedMnemonic: baseWallet.encryptedMnemonic,
    createdAt: Date.now(),
    name: `Wallet ${nextIndex + 1}`,
    chainId: chainId || baseWallet.chainId,
    derivationIndex: nextIndex,
  }
}
