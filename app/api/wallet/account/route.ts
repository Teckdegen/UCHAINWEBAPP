import { NextRequest, NextResponse } from "next/server"
import { userRegistry } from "@/lib/apiStorage"

export async function GET(request: NextRequest) {
  try {
    // Get userId from cookie
    const userId = request.cookies.get("unchained_user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "No user ID found" }, { status: 401 })
    }

    // Get user data from registry
    const userData = userRegistry.get(userId)

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      userId,
      address: userData.address,
      chainId: 1, // Default, can be stored per user
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to get account" }, { status: 500 })
  }
}

