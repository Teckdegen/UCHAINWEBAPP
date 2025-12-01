import { NextRequest, NextResponse } from "next/server"
import { userRegistry } from "@/lib/apiStorage"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, returnUrl } = body

    // Get userId from cookie
    const userId = request.cookies.get("unchained_user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "No user ID found" }, { status: 401 })
    }

    // Verify user exists
    const userData = userRegistry.get(userId)
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    // Redirect to wallet sign page
    const walletUrl = process.env.NEXT_PUBLIC_WALLET_URL || "http://localhost:3000"
    return NextResponse.json({
      redirectUrl: `${walletUrl}/sign?method=personal_sign&message=${encodeURIComponent(message)}&requestId=${requestId}&return=${encodeURIComponent(returnUrl || "")}`,
      requestId,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Sign request failed" }, { status: 500 })
  }
}

