import { ethers } from "ethers"
import CryptoJS from "crypto-js"
import { getOrCreateUserId, registerUserId } from "./userId"

export interface Wallet {
  id: string
  address: string
  encryptedPrivateKey: string
  encryptedMnemonic?: string
  createdAt: number
  name?: string
  chainId: number
}

const WALLETS_KEY = "unchained_wallets"
const WALLET_STATE_KEY = "unchained_wallet_state"
const AUTO_LOCK_KEY = "unchained_auto_lock_seconds"

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

  // Register userId with API when wallet is added
  if (typeof window !== "undefined") {
    const userId = getOrCreateUserId()
    registerUserId(userId, wallet.address).catch(() => {
      // Non-critical, continue even if API call fails
    })
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
  return decryptData(wallet.encryptedPrivateKey, password)
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
