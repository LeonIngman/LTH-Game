import { NextResponse } from "next/server"
import { saveGameResults } from "@/lib/actions/game-actions"
import { level0Config } from "@/lib/game/level0"
import { level1Config } from "@/lib/game/level1"
import { level2Config } from "@/lib/game/level2"
import { level3Config } from "@/lib/game/level3"

export async function POST(request: Request) {
  try {
    const { userId, levelId, gameState } = await request.json()

    if (!userId || levelId === undefined || !gameState) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get the appropriate level configuration
    let levelConfig
    switch (levelId) {
      case 0:
        levelConfig = level0Config
        break
      case 1:
        levelConfig = level1Config
        break
      case 2:
        levelConfig = level2Config
        break
      case 3:
        levelConfig = level3Config
        break
      default:
        return NextResponse.json({ error: "Invalid level ID" }, { status: 400 })
    }

    // Save game results using our server action
    const result = await saveGameResults(userId, levelId, gameState, levelConfig)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Level submitted successfully",
      })
    } else {
      return NextResponse.json(
        {
          error: result.error || "Failed to submit level",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error submitting level:", error)
    return NextResponse.json({ error: "Failed to submit level" }, { status: 500 })
  }
}
