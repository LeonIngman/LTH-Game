import { NextResponse } from "next/server"
import { loadGameSession } from "@/lib/actions/game-session"

export async function GET(request: Request) {
    try {
        const url = new URL(request.url)
        const userId = url.searchParams.get('userId')
        const levelId = url.searchParams.get('levelId')

        if (!userId || levelId === null) {
            return NextResponse.json(
                { error: "Missing required parameters: userId and levelId are required" },
                { status: 400 }
            )
        }

        const levelIdNum = parseInt(levelId, 10)
        if (isNaN(levelIdNum) || levelIdNum < 0) {
            return NextResponse.json(
                { error: "Invalid levelId: must be a non-negative integer" },
                { status: 400 }
            )
        }

        const result = await loadGameSession(userId, levelIdNum)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Failed to load game session" },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            gameState: result.gameState,
            sessionId: result.sessionId,
            hasSession: result.gameState !== null
        })

    } catch (error) {
        console.error("Error in load-game-state API:", error)
        return NextResponse.json(
            { error: "Internal server error while loading game state" },
            { status: 500 }
        )
    }
}
