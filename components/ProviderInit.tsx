"use client"

import { useEffect } from "react"
import { getUnchainedProvider } from "@/lib/provider"
import { getOrCreateUserId } from "@/lib/userId"

export default function ProviderInit() {
  useEffect(() => {
    // Initialize userId (sets cookie)
    getOrCreateUserId()

    // Initialize the provider when component mounts
    getUnchainedProvider()
  }, [])

  return null
}

