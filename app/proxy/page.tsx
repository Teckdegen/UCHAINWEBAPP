"use client"

/**
 * Proxy page that wraps dApp URLs and injects Unchained Wallet
 * This allows window.ethereum to be available in cross-origin iframes
 */

import { useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function ProxyContent() {
  const searchParams = useSearchParams()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const url = searchParams.get("url") || ""

  useEffect(() => {
    if (!url || !iframeRef.current) return

    // Inject our script into the iframe when it loads
    const injectScript = () => {
      try {
        const iframe = iframeRef.current
        if (!iframe?.contentDocument) return

        // Check if already injected
        if (iframe.contentWindow?.ethereum?.isUnchained) {
          console.log("[Proxy] Provider already injected")
          return
        }

        // Load inject script
        const script = iframe.contentDocument.createElement("script")
        script.src = `${window.location.origin}/unchained-inject.js?t=${Date.now()}`
        script.async = true
        script.onload = () => {
          console.log("[Proxy] ✅ Unchained provider injected")
        }
        script.onerror = () => {
          console.error("[Proxy] Failed to load inject script")
        }

        // Insert at the beginning of head
        if (iframe.contentDocument.head) {
          if (iframe.contentDocument.head.firstChild) {
            iframe.contentDocument.head.insertBefore(script, iframe.contentDocument.head.firstChild)
          } else {
            iframe.contentDocument.head.appendChild(script)
          }
        }
      } catch (error) {
        console.error("[Proxy] Injection error:", error)
      }
    }

    const iframe = iframeRef.current
    if (iframe) {
      iframe.addEventListener("load", () => {
        setTimeout(injectScript, 100)
      })

      // Also try immediately if already loaded
      if (iframe.contentDocument?.readyState === "complete") {
        setTimeout(injectScript, 100)
      }
    }
  }, [url])

  if (!url) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">No URL provided</p>
      </div>
    )
  }

  return (
    <div className="w-full h-screen">
      <iframe
        ref={iframeRef}
        src={url}
        className="w-full h-full border-0"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        allow="ethereum"
      />
    </div>
  )
}

export default function ProxyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <ProxyContent />
    </Suspense>
  )
}

