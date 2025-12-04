"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

export default function ExtensionResponsePage() {
  const searchParams = useSearchParams()
  const requestId = searchParams.get("requestId")

  useEffect(() => {
    // This page is just a marker for the extension background script
    // The background script will read the result from localStorage and close this window
    // Show a brief message then auto-close
    const timer = setTimeout(() => {
      if (window.opener) {
        window.close()
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Processing...</p>
      </div>
    </div>
  )
}

