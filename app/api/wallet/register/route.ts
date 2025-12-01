import { NextRequest, NextResponse } from "next/server"
import { userRegistry } from "@/lib/apiStorage"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, address } = body

    if (!userId || !address) {
      return NextResponse.json({ error: "Missing userId or address" }, { status: 400 })
    }

    // Store user mapping
    userRegistry.set(userId, {
      address: address.toLowerCase(),
      createdAt: Date.now(),
    })

    return NextResponse.json({ success: true, userId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 })
  }
}

