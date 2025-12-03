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
  const bytes = CryptoJS.AES.decrypt(encryptedData, password)
  return bytes.toString(CryptoJS.enc.Utf8)
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

export function lockWallet() {
  const state = getWalletState()
  state.isLocked = true
  saveWalletState(state)
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
    return true
  } catch {
    return false
  }
}

export function getPrivateKey(wallet: Wallet, password: string): string {
  try {
    const decrypted = decryptData(wallet.encryptedPrivateKey, password)
    
    // Validate decrypted result
    if (!decrypted || typeof decrypted !== 'string' || decrypted.trim().length === 0) {
      throw new Error("Failed to decrypt private key. The password may be incorrect.")
    }
    
    // Ensure private key has 0x prefix
    let cleaned = decrypted.trim()
    if (!cleaned.startsWith("0x")) {
      cleaned = "0x" + cleaned
    }
    
    // Validate private key format by trying to create a wallet
    try {
      new ethers.Wallet(cleaned)
    } catch (validationError: any) {
      throw new Error(`Invalid private key format: ${validationError.message}. The password may be incorrect.`)
    }
    
    return cleaned
  } catch (error: any) {
    // Re-throw with clearer message
    if (error.message.includes("password") || error.message.includes("decrypt")) {
      throw new Error("Incorrect password. Please try again.")
    }
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
  // Ethers v6: derive directly via Wallet.fromPhrase with a custom path
  const child = ethers.Wallet.fromPhrase(mnemonic, undefined, path)

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
