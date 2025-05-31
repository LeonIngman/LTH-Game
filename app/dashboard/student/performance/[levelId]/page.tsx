"use client"

import React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, BarChart3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { D3Chart } from "@/components/performance/d3-chart"
import { PerformanceSummary } from "@/components/performance/performance-summary"
import { useAuth } from "@/lib/auth-context"
import { getDetailedGameData, getGameLevels, getUserPerformance } from "@/lib/actions/performance-actions"
import { level0Config } from "@/lib/game/level0"
import { level1Config } from "@/lib/game/level1"
import { level2Config } from "@/lib/game/level2"
import { level3Config } from "@/lib/game/level3"

export default function StudentPerformancePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const levelId = typeof params === "object" && params && "levelId" in params ? (params as any).levelId : "0"

  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [detailedData, setDetailedData] = useState<any[]>([])
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

          // Get performance data
          const performance = await getUserPerformance(user.id, parsedLevelId)
          setPerformanceData(performance || [])

          // Get detailed game data
          const detailed = await getDetailedGameData(user.id, parsedLevelId)
          setDetailedData(detailed || [])
        } catch (error) {
          console.error("Error fetching performance data:", error)
          setError("Failed to load performance data. Please try again later.")
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
          <h1 className="text-2xl font-bold mt-2">Performance Analytics</h1>
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

  // Calculate current score and profit
  const currentScore = performanceData.length > 0 ? Math.max(...performanceData.map((p: any) => p.score)) : 0
  const totalProfit = performanceData.length > 0 ? performanceData[performanceData.length - 1]?.cumulativeProfit : 0

  // Check if we have detailed data
  const hasDetailedData = detailedData && detailedData.length > 0

  // Define column widths as percentages for even spacing
  const colWidths = {
    day: "16%",
    col: "16%",
    // For 6 columns: 16% each (16*6=96%, 4% left for borders/padding)
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
          <h1 className="text-2xl font-bold mt-2">Performance Analytics</h1>
          <p className="text-gray-500">Track your progress in {levelInfo?.name}</p>
        </div>

        <div className="flex items-center gap-2">
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

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <PerformanceSummary
            levelName={levelInfo?.name}
            maxScore={levelInfo?.maxScore}
            currentScore={currentScore}
            profit={Number(totalProfit)}
          />
        </div>
        <div className="md:col-span-2">
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
        </div>
      </div>

      {hasDetailedData && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Performance Data</CardTitle>
            <CardDescription>Detailed breakdown of your daily game performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="inventory" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="production">Production & Sales</TabsTrigger>
                <TabsTrigger value="costs">Costs</TabsTrigger>
              </TabsList>

              {/* Inventory Table */}
              <TabsContent value="inventory" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse table-fixed">
                    <colgroup>
                      <col style={{ width: colWidths.day }} />
                      <col style={{ width: colWidths.col }} />
                      <col style={{ width: colWidths.col }} />
                      <col style={{ width: colWidths.col }} />
                      <col style={{ width: colWidths.col }} />
                      <col style={{ width: colWidths.col }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-center">Day</th>
                        <th className="py-2 px-4 text-right font-mono">Patty</th>
                        <th className="py-2 px-4 text-right font-mono">Bun</th>
                        <th className="py-2 px-4 text-right font-mono">Cheese</th>
                        <th className="py-2 px-4 text-right font-mono">Potato</th>
                        <th className="py-2 px-4 text-right font-mono">Finished Goods</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedData.map((day: any) => (
                        <tr key={day.day} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4 text-center">Day {day.day}</td>
                          <td className="py-2 px-4 text-right font-mono">{day.pattyInventory}</td>
                          <td className="py-2 px-4 text-right font-mono">{day.bunInventory}</td>
                          <td className="py-2 px-4 text-right font-mono">{day.cheeseInventory}</td>
                          <td className="py-2 px-4 text-right font-mono">{day.potatoInventory}</td>
                          <td className="py-2 px-4 text-right font-mono">{day.finishedGoodsInventory}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Financial Table */}
              <TabsContent value="financial" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse table-fixed">
                    <colgroup>
                      <col style={{ width: colWidths.day }} />
                      <col style={{ width: colWidths.col }} />
                      <col style={{ width: colWidths.col }} />
                      <col style={{ width: colWidths.col }} />
                      <col style={{ width: colWidths.col }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-center">Day</th>
                        <th className="py-2 px-4 text-right font-mono">Cash</th>
                        <th className="py-2 px-4 text-right font-mono">Revenue</th>
                        <th className="py-2 px-4 text-right font-mono">Profit</th>
                        <th className="py-2 px-4 text-right font-mono">Cumulative Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedData.map((day: any) => (
                        <tr key={day.day} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4 text-center">Day {day.day}</td>
                          <td className="py-2 px-4 text-right font-mono">
                            {new Intl.NumberFormat("sv-SE", {
                              style: "currency",
                              currency: "SEK",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(Number(day.cash ?? 0))}
                          </td>
                          <td className="py-2 px-4 text-right font-mono">
                            {new Intl.NumberFormat("sv-SE", {
                              style: "currency",
                              currency: "SEK",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(Number(day.revenue ?? 0))}
                          </td>
                          <td className="py-2 px-4 text-right font-mono">
                            {new Intl.NumberFormat("sv-SE", {
                              style: "currency",
                              currency: "SEK",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(Number(day.profit ?? 0))}
                          </td>
                          <td className="py-2 px-4 text-right font-mono">
                            {new Intl.NumberFormat("sv-SE", {
                              style: "currency",
                              currency: "SEK",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(Number(day.cumulativeProfit ?? 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Production Table */}
              <TabsContent value="production" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse table-fixed">
                    <colgroup>
                      <col style={{ width: colWidths.day }} />
                      <col style={{ width: colWidths.col }} />
                      <col style={{ width: colWidths.col }} />
                      <col style={{ width: colWidths.col }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-center">Day</th>
                        <th className="py-2 px-4 text-right font-mono">Production</th>
                        <th className="py-2 px-4 text-right font-mono">Sales</th>
                        <th className="py-2 px-4 text-right font-mono">Efficiency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedData.map((day: any) => (
                        <tr key={day.day} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4 text-center">Day {day.day}</td>
                          <td className="py-2 px-4 text-right font-mono">{day.production} units</td>
                          <td className="py-2 px-4 text-right font-mono">{day.sales} units</td>
                          <td className="py-2 px-4 text-right font-mono">
                            {day.production > 0 ? `${((day.sales / day.production) * 100).toFixed(1)}%` : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Costs Table */}
              <TabsContent value="costs" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse table-fixed">
                    <colgroup>
                      <col style={{ width: colWidths.day }} />
                      <col style={{ width: colWidths.col }} />
                      <col style={{ width: colWidths.col }} />
                      <col style={{ width: colWidths.col }} />
                      <col style={{ width: colWidths.col }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-center">Day</th>
                        <th className="py-2 px-4 text-right font-mono">Purchase Costs</th>
                        <th className="py-2 px-4 text-right font-mono">Production Costs</th>
                        <th className="py-2 px-4 text-right font-mono">Holding Costs</th>
                        <th className="py-2 px-4 text-right font-mono">Total Costs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedData.map((day: any) => (
                        <tr key={day.day} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4 text-center">Day {day.day}</td>
                          <td className="py-2 px-4 text-right font-mono">
                            {new Intl.NumberFormat("sv-SE", {
                              style: "currency",
                              currency: "SEK",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(Number(day.purchaseCosts ?? 0))}
                          </td>
                          <td className="py-2 px-4 text-right font-mono">
                            {new Intl.NumberFormat("sv-SE", {
                              style: "currency",
                              currency: "SEK",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(Number(day.productionCosts ?? 0))}
                          </td>
                          <td className="py-2 px-4 text-right font-mono">
                            {new Intl.NumberFormat("sv-SE", {
                              style: "currency",
                              currency: "SEK",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(Number(day.holdingCosts ?? 0))}
                          </td>
                          <td className="py-2 px-4 text-right font-mono">
                            {new Intl.NumberFormat("sv-SE", {
                              style: "currency",
                              currency: "SEK",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(Number(day.totalCosts ?? 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
