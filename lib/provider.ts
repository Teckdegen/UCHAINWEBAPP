import { ethers } from "ethers"
import { getWallets, getWalletState } from "./wallet"
import { getProvider } from "./rpc"

export interface ConnectedDApp {
  id: string
  origin: string
  name: string
  iconUrl?: string
  connectedAt: number
}

const CONNECTED_DAPPS_KEY = "unchained_connected_dapps"
const PENDING_REQUESTS_KEY = "unchained_pending_requests"

export class UnchainedProvider {
  private connectedDApps: ConnectedDApp[] = []
  private requests: Map<string, any> = new Map()
  private currentChainId: number = 1 // Default to Ethereum

  constructor() {
    if (typeof window !== "undefined") {
      this.loadConnectedDApps()
      this.setupWindowEth()
      this.loadChainId()
      this.handleReturnFromRedirect()
    }
  }

  private handleReturnFromRedirect() {
    // Check if we're returning from a redirect with a result
    const urlParams = new URLSearchParams(window.location.search)
    const walletStatus = urlParams.get("wallet_status")
    
    if (walletStatus === "approved" || walletStatus === "rejected") {
      const result = urlParams.get("wallet_result")
      const error = urlParams.get("wallet_error")
      const requestId = urlParams.get("wallet_request_id") || localStorage.getItem("unchained_request_id")
      
      if (requestId) {
        // Store result for retrieval
        this.requests.set(requestId, {
          result: result ? decodeURIComponent(result) : undefined,
          error: error || undefined,
          timestamp: Date.now(),
        })
        
        // Also store in localStorage for persistence across page reloads
        if (result) {
          localStorage.setItem(`unchained_result_${requestId}`, decodeURIComponent(result))
        } else if (error) {
          localStorage.setItem(`unchained_error_${requestId}`, error)
        }
        
        // Clean up URL
        const cleanUrl = window.location.pathname
        window.history.replaceState({}, "", cleanUrl)
        
        // Dispatch event for dApps listening
        window.dispatchEvent(new CustomEvent("wallet_result", {
          detail: { requestId, result: result ? decodeURIComponent(result) : undefined, error }
        }))
      }
    }
  }

  private loadChainId() {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("unchained_chain_id")
    if (stored) {
      this.currentChainId = parseInt(stored, 10)
    }
  }

  private saveChainId() {
    if (typeof window === "undefined") return
    localStorage.setItem("unchained_chain_id", this.currentChainId.toString())
  }

  public setChainId(chainId: number) {
    this.currentChainId = chainId
    this.saveChainId()
    const hexChainId = `0x${chainId.toString(16)}`
    window.dispatchEvent(
      new CustomEvent("unchained:chainChanged", {
        detail: { chainId: hexChainId },
      }),
    )
  }

  public getChainId(): number {
    return this.currentChainId
  }

  private setupWindowEth() {
    const self = this
    
    const provider: any = {
      isMetaMask: true,
      isUnchained: true,

      request: async (args: { method: string; params?: any[] }) => {
        return self.handleRequest(args)
      },

      send: (method: string, params: any[] = []) => {
        return self.handleRequest({ method, params })
      },

      sendAsync: (payload: any, callback: (error: any, result: any) => void) => {
        self.handleRequest({ method: payload.method, params: payload.params || [] })
          .then((result) => callback(null, { result }))
          .catch((error) => callback(error, null))
      },

      on: (event: string, listener: (...args: any[]) => void) => {
        if (event === "accountsChanged") {
          window.addEventListener("unchained:accountsChanged", () => {
            listener(self.getAccounts())
          })
        }
        if (event === "chainChanged") {
          window.addEventListener("unchained:chainChanged", (e: any) => {
            listener(e.detail?.chainId || `0x${self.currentChainId.toString(16)}`)
          })
        }
        if (event === "connect") {
          window.addEventListener("unchained:connect", (e: any) => {
            listener(e.detail)
          })
        }
        if (event === "disconnect") {
          window.addEventListener("unchained:disconnect", () => {
            listener()
          })
        }
      },

      removeListener: (event: string, listener: (...args: any[]) => void) => {
        // Remove listener implementation
      },

      removeAllListeners: (event?: string) => {
        // Remove all listeners implementation
      },
    }

    // Make chainId reactive
    Object.defineProperty(provider, "chainId", {
      get: () => `0x${self.currentChainId.toString(16)}`,
      configurable: true,
      enumerable: true,
    })

    Object.defineProperty(provider, "networkVersion", {
      get: () => self.currentChainId.toString(),
      configurable: true,
      enumerable: true,
    })

    // Only set if window.ethereum doesn't exist or if it's our provider
    if (!window.ethereum || (window.ethereum as any).isUnchained) {
    Object.defineProperty(window, "ethereum", {
      value: provider,
      writable: true,
        configurable: true,
    })
    }
  }

  private async handleRequest(args: { method: string; params?: any[] }) {
    const { method, params = [] } = args

    switch (method) {
      case "eth_requestAccounts":
        return this.requestAccounts()
      case "eth_accounts":
        return this.getAccounts()
      case "eth_chainId":
        return `0x${this.currentChainId.toString(16)}`
      case "net_version":
        return this.currentChainId.toString()
      case "wallet_switchEthereumChain":
        if (params[0]?.chainId) {
          const chainId = parseInt(params[0].chainId, 16)
          this.setChainId(chainId)
          return null
        }
        throw new Error("Invalid chain ID")
      case "wallet_addEthereumChain":
        // Just approve, don't actually add
        return null
      case "personal_sign":
        return this.personalSign(params[0], params[1])
      case "eth_sign":
        return this.ethSign(params[0], params[1])
      case "eth_signTypedData":
      case "eth_signTypedData_v4":
        return this.signTypedData(params[0], params[1], params[2])
      case "eth_sendTransaction":
        return this.sendTransaction(params[0])
      case "eth_call":
      case "eth_getBalance":
      case "eth_getCode":
      case "eth_getStorageAt":
      case "eth_getTransactionCount":
      case "eth_estimateGas":
      case "eth_getBlockByNumber":
      case "eth_getBlockByHash":
      case "eth_getTransactionByHash":
      case "eth_getTransactionReceipt":
      case "eth_blockNumber":
      case "eth_gasPrice":
        return this.forwardToProvider(method, params)
      default:
        throw new Error(`Method ${method} not supported`)
    }
  }

  private async requestAccounts() {
    const state = getWalletState()
    const currentOrigin = window.location.origin
    
    if (state.isLocked) {
      // Store the return URL and redirect to unlock
      const returnUrl = window.location.href
      localStorage.setItem("unchained_return_url", returnUrl)
      localStorage.setItem("unchained_return_origin", currentOrigin)
      window.location.href = `${currentOrigin}/unlock?redirect=${encodeURIComponent(returnUrl)}`
      throw new Error("Wallet is locked")
    }

    // If we're on the connect page, we've already been redirected
    if (window.location.pathname === "/connect") {
    const accounts = this.getAccounts()
    if (accounts.length === 0) {
      throw new Error("No accounts available")
    }
    return accounts
    }

    // Redirect to connect page (like OAuth flow)
    const returnOrigin = currentOrigin
    const returnUrl = window.location.href
    localStorage.setItem("unchained_return_url", returnUrl)
    localStorage.setItem("unchained_return_origin", returnOrigin)
    
    const connectUrl = `${currentOrigin}/connect?origin=${encodeURIComponent(returnOrigin)}&method=eth_requestAccounts`
    window.location.href = connectUrl
    
    throw new Error("Redirecting to connect page")
  }

  private getAccounts() {
    const wallets = getWallets()
    const state = getWalletState()
    if (state.isLocked || wallets.length === 0) {
      return []
    }
    return [wallets[0].address.toLowerCase()]
  }

  private async personalSign(message: string, address: string) {
    const wallet = getWallets()[0]
    if (!wallet || wallet.address.toLowerCase() !== address.toLowerCase()) {
      throw new Error("Account not found")
    }

    // Check if we have a result from a previous redirect
    const storedRequestId = localStorage.getItem("unchained_request_id")
    if (storedRequestId) {
      const cachedResult = this.requests.get(storedRequestId)
      const storedResult = localStorage.getItem(`unchained_result_${storedRequestId}`)
      const storedError = localStorage.getItem(`unchained_error_${storedRequestId}`)
      
      if (cachedResult || storedResult || storedError) {
        // Clean up
        localStorage.removeItem("unchained_request_id")
        localStorage.removeItem(`unchained_result_${storedRequestId}`)
        localStorage.removeItem(`unchained_error_${storedRequestId}`)
        this.requests.delete(storedRequestId)
        
        if (storedError || cachedResult?.error) {
          throw new Error(storedError || cachedResult.error)
        }
        return storedResult || cachedResult?.result
      }
    }
    
    const requestId = Math.random().toString(36).substring(7)

    // Redirect to sign page (like OAuth flow)
    const currentOrigin = window.location.origin
    const returnUrl = window.location.origin + window.location.pathname
    
    localStorage.setItem("unchained_return_url", returnUrl)
    localStorage.setItem("unchained_return_origin", currentOrigin)
    localStorage.setItem("unchained_request_id", requestId)
    
    const signUrl = `${currentOrigin}/sign?method=personal_sign&message=${encodeURIComponent(message)}&address=${encodeURIComponent(address)}&requestId=${requestId}&origin=${encodeURIComponent(currentOrigin)}`
    window.location.href = signUrl
    
    return new Promise(() => {})
  }

  private async ethSign(address: string, data: string) {
    return this.personalSign(data, address)
  }

  private async signTypedData(domain: any, types: any, value: any) {
    const wallet = getWallets()[0]
    if (!wallet) {
      throw new Error("No wallet found")
    }

    // Check if we have a result from a previous redirect
    const storedRequestId = localStorage.getItem("unchained_request_id")
    if (storedRequestId) {
      const cachedResult = this.requests.get(storedRequestId)
      const storedResult = localStorage.getItem(`unchained_result_${storedRequestId}`)
      const storedError = localStorage.getItem(`unchained_error_${storedRequestId}`)
      
      if (cachedResult || storedResult || storedError) {
        // Clean up
        localStorage.removeItem("unchained_request_id")
        localStorage.removeItem(`unchained_result_${storedRequestId}`)
        localStorage.removeItem(`unchained_error_${storedRequestId}`)
        this.requests.delete(storedRequestId)
        
        if (storedError || cachedResult?.error) {
          throw new Error(storedError || cachedResult.error)
        }
        return storedResult || cachedResult?.result
      }
    }
    
    const requestId = Math.random().toString(36).substring(7)
    const currentOrigin = window.location.origin
    const returnUrl = window.location.origin + window.location.pathname
    const params = encodeURIComponent(JSON.stringify([domain, types, value]))
    
    localStorage.setItem("unchained_return_url", returnUrl)
    localStorage.setItem("unchained_return_origin", currentOrigin)
    localStorage.setItem("unchained_request_id", requestId)
    
    const signUrl = `${currentOrigin}/sign?method=eth_signTypedData_v4&params=${params}&requestId=${requestId}&origin=${encodeURIComponent(currentOrigin)}`
    window.location.href = signUrl
    
    return new Promise(() => {})
  }

  private async sendTransaction(tx: any) {
    const wallet = getWallets()[0]
    if (!wallet) {
      throw new Error("No wallet found")
    }

    // Check if we have a result from a previous redirect
    const storedRequestId = localStorage.getItem("unchained_request_id")
    if (storedRequestId) {
      const cachedResult = this.requests.get(storedRequestId)
      const storedResult = localStorage.getItem(`unchained_result_${storedRequestId}`)
      const storedError = localStorage.getItem(`unchained_error_${storedRequestId}`)
      
      if (cachedResult || storedResult || storedError) {
        // Clean up
        localStorage.removeItem("unchained_request_id")
        localStorage.removeItem(`unchained_result_${storedRequestId}`)
        localStorage.removeItem(`unchained_error_${storedRequestId}`)
        this.requests.delete(storedRequestId)
        
        if (storedError || cachedResult?.error) {
          throw new Error(storedError || cachedResult.error)
        }
        return storedResult || cachedResult?.result
      }
    }
    
    const requestId = Math.random().toString(36).substring(7)
    const currentOrigin = window.location.origin
    const returnUrl = window.location.origin + window.location.pathname
    const params = encodeURIComponent(JSON.stringify([tx]))
    
    localStorage.setItem("unchained_return_url", returnUrl)
    localStorage.setItem("unchained_return_origin", currentOrigin)
    localStorage.setItem("unchained_request_id", requestId)
    
    const signUrl = `${currentOrigin}/sign?method=eth_sendTransaction&params=${params}&requestId=${requestId}&origin=${encodeURIComponent(currentOrigin)}`
    window.location.href = signUrl
    
    return new Promise(() => {})
  }

  private async forwardToProvider(method: string, params: any[]) {
    const provider = getProvider(this.currentChainId)
    return provider.send(method, params)
  }

  public addConnectedDApp(origin: string, name: string, iconUrl?: string): ConnectedDApp {
    const dapp: ConnectedDApp = {
      id: Math.random().toString(36).substring(7),
      origin,
      name,
      iconUrl,
      connectedAt: Date.now(),
    }
    this.connectedDApps.push(dapp)
    this.saveConnectedDApps()
    return dapp
  }

  public getConnectedDApps(): ConnectedDApp[] {
    return this.connectedDApps
  }

  public removeConnectedDApp(id: string) {
    this.connectedDApps = this.connectedDApps.filter((d) => d.id !== id)
    this.saveConnectedDApps()
  }

  private loadConnectedDApps() {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem(CONNECTED_DAPPS_KEY)
    this.connectedDApps = stored ? JSON.parse(stored) : []
  }

  private saveConnectedDApps() {
    if (typeof window === "undefined") return
    localStorage.setItem(CONNECTED_DAPPS_KEY, JSON.stringify(this.connectedDApps))
  }
}

// Singleton instance
let provider: UnchainedProvider | null = null

export function getUnchainedProvider(): UnchainedProvider {
  if (!provider && typeof window !== "undefined") {
    provider = new UnchainedProvider()
  }
  return provider!
}
