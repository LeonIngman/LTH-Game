"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, BarChart3, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { D3Chart } from "@/components/performance/d3-chart"
import { GameHistorySummary } from "@/components/game-history/game-history-summary"
import { SessionList } from "@/components/game-history/session-list"
import { ProgressTimeline } from "@/components/game-history/progress-timeline"
import { useAuth } from "@/lib/auth-context"
import { getDetailedGameData, getGameLevels } from "@/lib/actions/performance-actions"
import { getGameHistory, getGameHistoryOverview, getProgressTimeline, exportGameHistoryData } from "@/lib/actions/game-history-actions"
import { level0Config } from "@/lib/game/level0"
import { level1Config } from "@/lib/game/level1"
import { level2Config } from "@/lib/game/level2"
import { level3Config } from "@/lib/game/level3"
import type { GameHistoryEntry, GameHistoryOverview } from "@/types/game"

export default function StudentGameHistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const levelId = typeof params === "object" && params && "levelId" in params ? (params as any).levelId : "0"

  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([])
  const [historyOverview, setHistoryOverview] = useState<GameHistoryOverview[]>([])
  const [detailedData, setDetailedData] = useState<any[]>([])
  const [progressData, setProgressData] = useState<any[]>([])
  const [levels, setLevels] = useState<any[]>([])
  const [levelInfo, setLevelInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartType, setChartType] = useState("inventory")

  // Parse the level ID and validate it
  const parsedLevelId = Number.parseInt(levelId)

  // Check if levelId is valid (0, 1, 2, or 3)
  const isValidLevelId = !isNaN(parsedLevelId) && parsedLevelId >= 0 && parsedLevelId <= 3

  const levelConfigs = [level0Config, level1Config, level2Config, level3Config]
  const levelConfig = levelConfigs[parsedLevelId]

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
          setLevels(allLevels)

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

          // Get game history data
          const history = await getGameHistory(user.id, parsedLevelId)
          setGameHistory(history)

          // Get overview data
          const overview = await getGameHistoryOverview(user.id)
          setHistoryOverview(overview)

          // Get progress timeline data
          const progress = await getProgressTimeline(user.id, parsedLevelId)
          setProgressData(progress)

          // Get detailed game data for the latest session
          const detailed = await getDetailedGameData(user.id, parsedLevelId)
          setDetailedData(detailed || [])
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

  const handleLevelChange = (newLevelId: string) => {
    router.push(`/dashboard/student/performance/${newLevelId}`)
  }

  const handleExportData = async () => {
    try {
      const exportData = await exportGameHistoryData(user?.id || '', 'json')
      if (exportData) {
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

  // Get current level overview
  const currentLevelOverview = historyOverview.find(overview => overview.levelId === parsedLevelId)

  // Check if we have detailed data
  const hasDetailedData = detailedData && detailedData.length > 0

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
          <h1 className="text-2xl font-bold mt-2">Game History</h1>
          <p className="text-gray-500">Track your progress in {levelInfo?.name}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportData} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Select value={parsedLevelId.toString()} onValueChange={handleLevelChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Level" />
            </SelectTrigger>
            <SelectContent>
              {levels.map((level: any) => (
                <SelectItem key={level.id} value={level.id.toString()}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              {currentLevelOverview ? (
                <GameHistorySummary overview={currentLevelOverview} />
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center text-gray-500">
                      No game history available for this level.
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            <div className="md:col-span-2">
              <SessionList 
                sessions={gameHistory.slice(0, 5)} 
                isLoading={isLoading}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <SessionList 
            sessions={gameHistory} 
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <ProgressTimeline data={progressData} levelId={parsedLevelId} />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Detailed Performance Analysis</CardTitle>
                  <CardDescription>Analyze your game performance metrics</CardDescription>
                </div>
                <Select value={chartType} onValueChange={setChartType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Chart" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inventory">Inventory Levels</SelectItem>
                    <SelectItem value="financial">Financial Metrics</SelectItem>
                    <SelectItem value="production">Production & Sales</SelectItem>
                    <SelectItem value="costs">Cost Breakdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {hasDetailedData ? (
                <D3Chart
                  data={detailedData}
                  chartType={chartType}
                  width={800}
                  height={400}
                  overstock={levelConfig.overstock}
                />
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <BarChart3 className="h-10 w-10 text-gray-400" />
                  <h3 className="mt-4 text-lg font-semibold">No Detailed Data Available</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Complete a game and save your results to see detailed performance analytics.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
