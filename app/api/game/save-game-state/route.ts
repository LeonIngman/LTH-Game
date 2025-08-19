import { NextResponse } from "next/server"
import { saveGameSession } from "@/lib/actions/game-session"

export async function POST(request: Request) {
    try {
        const { userId, levelId, gameState } = await request.json()

        if (!userId || levelId === undefined || !gameState) {
            return NextResponse.json(
                { error: "Missing required parameters: userId, levelId, and gameState are required" },
                { status: 400 }
            )
        }

        const result = await saveGameSession(userId, levelId, gameState)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Failed to save game session" },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            sessionId: result.sessionId,
            message: "Game state saved successfully"
        })

    } catch (error) {
        console.error("Error in save-game-state API:", error)
        return NextResponse.json(
            { error: "Internal server error while saving game state" },
            { status: 500 }
        )
    }
}
