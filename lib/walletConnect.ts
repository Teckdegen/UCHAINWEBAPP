/**
 * WalletConnect Wallet SDK Integration
 * 
 * This module provides a Turbopack-safe implementation of WalletConnect
 * by using dynamic imports to only load the SDK client-side.
 * 
 * NOTE: No type imports from WalletConnect packages to avoid Turbopack
 * analyzing dependencies during SSR. All types are inferred or use `any`.
 */

const projectId = "c4999d9eb922d2b83794b896c6abea5a" // User's provided Project ID

// Use any to avoid type imports that trigger Turbopack analysis
let signClient: any = undefined
let initPromise: Promise<any> | null = null

/**
 * Dynamically imports and initializes the WalletConnect SignClient.
 * This is done client-side only to avoid Turbopack build issues.
 */
async function getWalletConnectClient(): Promise<any> {
  if (signClient) return signClient

  if (initPromise) return initPromise

  if (typeof window === "undefined") {
    throw new Error("WalletConnect can only be initialized client-side")
  }

  initPromise = (async () => {
    // Dynamic import to avoid Turbopack parsing issues
    const { SignClient } = await import("@walletconnect/sign-client")

    signClient = await SignClient.init({
      projectId,
      metadata: {
        name: "Unchained Web Wallet",
        description: "Unchained Web Wallet for Ethereum and PEPU",
        url: window.location.origin,
        icons: [`${window.location.origin}/icon.png`],
      },
    })

    console.log("[WalletConnect] SignClient initialized:", signClient)

    // Setup event listeners
    setupWalletConnectEventListeners(signClient)

    return signClient
  })()

  return initPromise
}

function setupWalletConnectEventListeners(client: SignClient) {
  client.on("session_proposal", async (proposal) => {
    console.log("[WalletConnect] session_proposal:", proposal)

    // Store proposal in localStorage for /connect page to pick up
    const proposalKey = `wc_proposal_${proposal.id}`
    localStorage.setItem(proposalKey, JSON.stringify(proposal))
    localStorage.setItem("wc_proposal_id", proposal.id.toString())

    // Redirect to connect page with WalletConnect proposal
    window.location.href = `/connect?wc_proposal=${proposal.id}`
  })

  client.on("session_request", async (request) => {
    console.log("[WalletConnect] session_request:", request)

    // Store request in localStorage for /sign page to pick up
    const requestKey = `wc_request_${request.id}`
    localStorage.setItem(requestKey, JSON.stringify(request))
    localStorage.setItem("wc_request_id", request.id.toString())

    // Redirect to sign page with WalletConnect request
    window.location.href = `/sign?wc_request=${request.id}`
  })

  client.on("session_delete", ({ id, topic }) => {
    console.log("[WalletConnect] session_delete:", { id, topic })
    // Clean up session data
    const sessions = getStoredSessions()
    const updated = sessions.filter((s) => s.topic !== topic)
    localStorage.setItem("wc_sessions", JSON.stringify(updated))
  })

  client.on("session_event", (event) => {
    console.log("[WalletConnect] session_event:", event)
  })

  client.on("session_update", ({ id, topic, params }) => {
    console.log("[WalletConnect] session_update:", { id, topic, params })
  })
}

/**
 * Get stored WalletConnect sessions from localStorage
 */
export function getStoredSessions(): any[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem("wc_sessions")
  return stored ? JSON.parse(stored) : []
}

/**
 * Store a WalletConnect session
 */
export function storeSession(session: any) {
  if (typeof window === "undefined") return
  const sessions = getStoredSessions()
  const existing = sessions.findIndex((s: any) => s.topic === session.topic)
  if (existing >= 0) {
    sessions[existing] = session
  } else {
    sessions.push(session)
  }
  localStorage.setItem("wc_sessions", JSON.stringify(sessions))
}

/**
 * Get a stored WalletConnect proposal by ID
 */
export function getStoredProposal(id: string): any | null {
  if (typeof window === "undefined") return null
  const key = `wc_proposal_${id}`
  const stored = localStorage.getItem(key)
  if (stored) {
    localStorage.removeItem(key) // Clean up after reading
    return JSON.parse(stored)
  }
  return null
}

/**
 * Get a stored WalletConnect request by ID
 */
export function getStoredRequest(id: string): any | null {
  if (typeof window === "undefined") return null
  const key = `wc_request_${id}`
  const stored = localStorage.getItem(key)
  if (stored) {
    localStorage.removeItem(key) // Clean up after reading
    return JSON.parse(stored)
  }
  return null
}

/**
 * Approve a WalletConnect session proposal
 */
export async function approveSessionProposal(
  proposalId: number,
  accounts: string[],
  chainId: number = 1
): Promise<void> {
  const client = await getWalletConnectClient()
  const proposal = getStoredProposal(proposalId.toString())

  if (!proposal) {
    throw new Error("Proposal not found")
  }

  const { id, params } = proposal

  const namespaces: any = {}
  const requiredChains = params.requiredNamespaces.eip155?.chains || []
  const optionalChains = params.optionalNamespaces?.eip155?.chains || []
  const allChains = [...requiredChains, ...optionalChains]

  // Support Ethereum mainnet (eip155:1) and PEPU if needed
  const supportedChains = ["eip155:1"] // Add PEPU chain ID if you have one
  const chains = allChains.filter((chain: string) => supportedChains.includes(chain))

  namespaces.eip155 = {
    accounts: accounts.map((addr: string) => `eip155:${chainId}:${addr}`),
    chains: chains.length > 0 ? chains : ["eip155:1"],
    methods: params.requiredNamespaces.eip155?.methods || [
      "eth_sendTransaction",
      "eth_signTransaction",
      "eth_sign",
      "personal_sign",
      "eth_signTypedData",
    ],
    events: params.requiredNamespaces.eip155?.events || ["chainChanged", "accountsChanged"],
  }

  await client.approve({
    id,
    namespaces,
  })

  console.log("[WalletConnect] Session approved:", { id, accounts, chainId })
}

/**
 * Reject a WalletConnect session proposal
 */
export async function rejectSessionProposal(proposalId: number, reason?: string): Promise<void> {
  const client = await getWalletConnectClient()
  const proposal = getStoredProposal(proposalId.toString())

  if (!proposal) {
    throw new Error("Proposal not found")
  }

  // Dynamic import to avoid Turbopack build issues
  const { getSdkError } = await import("@walletconnect/utils")

  await client.reject({
    id: proposal.id,
    reason: reason ? getSdkError(reason as any) : getSdkError("USER_REJECTED"),
  })

  console.log("[WalletConnect] Session rejected:", proposalId)
}

/**
 * Approve a WalletConnect session request (sign transaction/message)
 */
export async function approveSessionRequest(
  requestId: number,
  result: string
): Promise<void> {
  const client = await getWalletConnectClient()
  const request = getStoredRequest(requestId.toString())

  if (!request) {
    throw new Error("Request not found")
  }

  await client.respond({
    topic: request.topic,
    response: {
      id: request.id,
      jsonrpc: "2.0",
      result,
    },
  })

  console.log("[WalletConnect] Request approved:", requestId)
}

/**
 * Reject a WalletConnect session request
 */
export async function rejectSessionRequest(
  requestId: number,
  reason?: string
): Promise<void> {
  const client = await getWalletConnectClient()
  const request = getStoredRequest(requestId.toString())

  if (!request) {
    throw new Error("Request not found")
  }

  // Dynamic import to avoid Turbopack build issues
  const { getSdkError } = await import("@walletconnect/utils")

  await client.respond({
    topic: request.topic,
    response: {
      id: request.id,
      jsonrpc: "2.0",
      error: reason ? getSdkError(reason as any) : getSdkError("USER_REJECTED"),
    },
  })

  console.log("[WalletConnect] Request rejected:", requestId)
}

/**
 * Initialize WalletConnect client (called on app startup)
 */
export async function initWalletConnect(): Promise<void> {
  if (typeof window === "undefined") return

  try {
    await getWalletConnectClient()
  } catch (error) {
    console.error("[WalletConnect] Failed to initialize:", error)
  }
}

// Export the client getter for advanced usage
export { getWalletConnectClient }

