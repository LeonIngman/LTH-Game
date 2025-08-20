"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, BarChart3, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DailyProgress } from "@/components/performance/daily-progress"
import { useAuth } from "@/lib/auth-context"
import { getGameLevels, getCurrentGameSessionData, getGameSessionData } from "@/lib/actions/performance-actions"
import type { GameHistoryEntry } from "@/types/game"

export default function StudentGameHistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const levelId = typeof params === "object" && params && "levelId" in params ? (params as any).levelId : "0"

  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([])
  const [levelInfo, setLevelInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Parse the level ID and validate it
  const parsedLevelId = Number.parseInt(levelId)

  // Check if levelId is valid (0, 1, 2, or 3)
  const isValidLevelId = !isNaN(parsedLevelId) && parsedLevelId >= 0 && parsedLevelId <= 3

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/signin")
        return
      }

      // If invalid level ID, redirect to dashboard
      if (!isValidLevelId) {
        setError("Invalid level ID. Please select a valid level.")
        setIsLoading(false)
        return
      }

      const fetchData = async () => {
        try {
          // Get all levels
          const allLevels = await getGameLevels()

          // Get current level info
          const currentLevel = allLevels.find((level: any) => level.id === parsedLevelId)

          if (!currentLevel) {
            // If level doesn't exist, use a fallback approach
            setLevelInfo({
              id: parsedLevelId,
              name: `Level ${parsedLevelId}`,
              description: "Game level",
              maxScore: 1000 * (parsedLevelId + 1),
            })
          } else {
            setLevelInfo(currentLevel)
          }

          // Get current game session data (daily progress)
          const currentSessionData = await getCurrentGameSessionData(user.id, parsedLevelId)

          // If no data found in Performance/GameDailyData, try GameSession table
          let finalGameData = currentSessionData
          if (currentSessionData.length === 0) {
            const gameSessionData = await getGameSessionData(user.id, parsedLevelId)
            finalGameData = gameSessionData
          }

          // Set the current session data as game history (for display in the table)
          setGameHistory(finalGameData)

        } catch (error) {
          console.error("Error fetching game history data:", error)
          setError("Failed to load game history data. Please try again later.")
        } finally {
          setIsLoading(false)
        }
      }

      fetchData()
    }
  }, [user, loading, router, parsedLevelId, isValidLevelId])

  const handleExportData = async () => {
    try {
      // Use the existing gameHistory data for export
      const exportData = {
        format: 'json',
        data: gameHistory.map(entry => ({
          level: entry.levelName || `Level ${entry.levelId}`,
          date: entry.createdAt,
          score: entry.score,
          profit: entry.cumulativeProfit,
          cashFlow: entry.cashFlow,
          decisions: entry.decisions
        }))
      }

      if (exportData.data.length > 0) {
        const blob = new Blob([JSON.stringify(exportData.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `game-history-level-${parsedLevelId}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  if (loading || (isLoading && !error) || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  // If there's an error or invalid level ID, show error message
  if (error || !isValidLevelId) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/dashboard/student"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-2">Game History</h1>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <BarChart3 className="h-10 w-10 text-amber-400" />
          <h3 className="mt-4 text-lg font-semibold text-amber-600">{error || "Invalid level selected"}</h3>
          <p className="mt-2 text-sm text-gray-500">Please return to the dashboard and select a valid level.</p>
          <Button onClick={() => router.push("/dashboard/student")} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/dashboard/student"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-2">Game Progress</h1>
          <p className="text-gray-500">Track your daily performance in {levelInfo?.name}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportData} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <DailyProgress
        dailyData={gameHistory}
        isLoading={isLoading}
      />
    </div>
  )
}
