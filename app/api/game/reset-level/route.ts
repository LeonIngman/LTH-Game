import { NextRequest, NextResponse } from 'next/server'
import { deleteGameSession } from '@/lib/actions/game-session'

/**
 * DELETE /api/game/reset-level
 * Reset a game level by deleting the saved game session
 */
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, levelId } = body

        // Validate required fields
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400 }
            )
        }

        if (typeof levelId !== 'number' || levelId < 0) {
            return NextResponse.json(
                { success: false, error: 'Valid level ID is required' },
                { status: 400 }
            )
        }

        // Log reset action for telemetry (without storing secrets)
        console.log(`[RESET_LEVEL] User: ${userId}, Level: ${levelId}, Timestamp: ${new Date().toISOString()}`)

        // Delete the game session
        const result = await deleteGameSession(userId, levelId)

        if (!result.success) {
            console.error(`[RESET_LEVEL_FAILED] User: ${userId}, Level: ${levelId}, Error: ${result.error}`)
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            )
        }

        // Log successful reset
        console.log(`[RESET_LEVEL_SUCCESS] User: ${userId}, Level: ${levelId}`)

        return NextResponse.json({
            success: true,
            message: `Level ${levelId} has been reset successfully`
        })

    } catch (error) {
        console.error('Reset level API error:', error)

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            },
            { status: 500 }
        )
    }
}
