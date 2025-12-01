import { NextRequest, NextResponse } from "next/server"
import { userRegistry, sessions } from "@/lib/apiStorage"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { returnUrl } = body

    // Get userId from cookie
    const userId = request.cookies.get("unchained_user_id")?.value

    if (!userId) {
      // No wallet - redirect to setup
      return NextResponse.json({
        redirectUrl: `${process.env.NEXT_PUBLIC_WALLET_URL || "http://localhost:3000"}/setup?return=${encodeURIComponent(returnUrl || "")}`,
      })
    }

    // Check if userId exists in registry
    const userData = userRegistry.get(userId)

    if (!userData) {
      // User ID exists but no wallet registered
      return NextResponse.json({
        redirectUrl: `${process.env.NEXT_PUBLIC_WALLET_URL || "http://localhost:3000"}/setup?return=${encodeURIComponent(returnUrl || "")}`,
      })
    }

    // Generate session token
    const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    // Store session
    sessions.set(sessionToken, {
      userId,
      returnUrl: returnUrl || "",
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    })

    // Redirect to wallet connect page
    const walletUrl = process.env.NEXT_PUBLIC_WALLET_URL || "http://localhost:3000"
    return NextResponse.json({
      redirectUrl: `${walletUrl}/connect?token=${sessionToken}&return=${encodeURIComponent(returnUrl || "")}`,
      sessionToken,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Connection failed" }, { status: 500 })
  }
}

