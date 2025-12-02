"use client"

import SignClient from "@walletconnect/sign-client"

// WalletConnect Cloud project id you provided
const WALLETCONNECT_PROJECT_ID = "c4999d9eb922d2b83794b896c6abea5a"

let clientPromise: Promise<SignClient> | null = null

export function getWalletConnectClient(): Promise<SignClient> {
  if (!clientPromise) {
    clientPromise = SignClient.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: "Unchained Web Wallet",
        description: "Non-custodial wallet for ETH and PEPU",
        url: typeof window !== "undefined" ? window.location.origin : "https://unchained.example",
        icons: [typeof window !== "undefined" ? `${window.location.origin}/icon.svg` : "https://unchained.example/icon.svg"],
      },
    }).then((client) => {
      // Basic listeners – later we can route these into nice UI screens
      client.on("session_proposal", (proposal) => {
        console.log("[Unchained][WalletConnect] session_proposal", proposal)
        // TODO: show a nice approval UI and call client.approve() / client.reject()
      })

      client.on("session_request", (event) => {
        console.log("[Unchained][WalletConnect] session_request", event)
        // TODO: route to /sign-style screen and sign / send tx, then respond via client.respond()
      })

      return client
    })
  }
  return clientPromise
}


