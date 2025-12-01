"use client"

import { useEffect } from "react"
import { getUnchainedProvider } from "@/lib/provider"

export default function ProviderInit() {
  useEffect(() => {
    // Initialize the provider when component mounts
    getUnchainedProvider()
  }, [])

  return null
}

