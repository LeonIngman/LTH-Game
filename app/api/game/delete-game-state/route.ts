import { NextResponse } from "next/server"
import { deleteGameSession } from "@/lib/actions/game-session"

export async function DELETE(request: Request) {
    try {
        const { userId, levelId } = await request.json()

        if (!userId || levelId === undefined) {
            return NextResponse.json(
                { error: "Missing required parameters: userId and levelId are required" },
                { status: 400 }
            )
        }

        const result = await deleteGameSession(userId, levelId)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Failed to delete game session" },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: "Game session deleted successfully"
        })

    } catch (error) {
        console.error("Error in delete-game-state API:", error)
        return NextResponse.json(
            { error: "Internal server error while deleting game session" },
            { status: 500 }
        )
    }
}
