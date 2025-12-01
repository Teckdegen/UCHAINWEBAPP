import { NextRequest, NextResponse } from "next/server"
import { userRegistry } from "@/lib/apiStorage"

export async function GET(request: NextRequest) {
  try {
    // Get userId from cookie
    const userId = request.cookies.get("unchained_user_id")?.value

    if (!userId) {
      return NextResponse.json({ exists: false, hasWallet: false })
    }

    // Check if userId exists in registry
    const userData = userRegistry.get(userId)

    if (!userData) {
      return NextResponse.json({ exists: false, hasWallet: false, userId })
    }

    return NextResponse.json({
      exists: true,
      hasWallet: true,
      userId,
      address: userData.address,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Status check failed" }, { status: 500 })
  }
}

