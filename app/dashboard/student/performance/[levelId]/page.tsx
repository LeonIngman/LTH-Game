"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, BarChart3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { D3Chart } from "@/components/performance/d3-chart"
import { PerformanceSummary } from "@/components/performance/performance-summary"
import { useAuth } from "@/lib/auth-context"
import { getDetailedGameData, getGameLevels, getUserPerformance } from "@/lib/actions/performance-actions"

export default function StudentPerformancePage({ params }: { params: { levelId: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [performanceData, setPerformanceData] = useState([])
  const [detailedData, setDetailedData] = useState([])
  const [levels, setLevels] = useState<any[]>([])
  const [levelInfo, setLevelInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartType, setChartType] = useState("inventory")

  // Parse the level ID and validate it
  const levelId = Number.parseInt(params.levelId)

  // Check if levelId is valid (0, 1, 2, or 3)
  const isValidLevelId = !isNaN(levelId) && levelId >= 0 && levelId <= 3

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
          const currentLevel = allLevels.find((level: any) => level.id === levelId)

          if (!currentLevel) {
            // If level doesn't exist, use a fallback approach
            setLevelInfo({
              id: levelId,
              name: `Level ${levelId}`,
              description: "Game level",
              maxScore: 1000 * (levelId + 1),
            })
          } else {
            setLevelInfo(currentLevel)
          }

          // Get performance data
          const performance = await getUserPerformance(user.id, levelId)
          setPerformanceData(performance || [])

          // Get detailed game data
          const detailed = await getDetailedGameData(user.id, levelId)
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
  }, [user, loading, router, levelId, isValidLevelId])

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
          <Select value={levelId.toString()} onValueChange={handleLevelChange}>
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
                <D3Chart data={detailedData} chartType={chartType} width={800} height={400} />
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

              <TabsContent value="inventory" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left">Day</th>
                        <th className="py-2 px-4 text-left">Patty</th>
                        <th className="py-2 px-4 text-left">Bun</th>
                        <th className="py-2 px-4 text-left">Cheese</th>
                        <th className="py-2 px-4 text-left">Potato</th>
                        <th className="py-2 px-4 text-left">Finished Goods</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedData.map((day: any) => (
                        <tr key={day.day} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">Day {day.day}</td>
                          <td className="py-2 px-4">{day.pattyInventory}</td>
                          <td className="py-2 px-4">{day.bunInventory}</td>
                          <td className="py-2 px-4">{day.cheeseInventory}</td>
                          <td className="py-2 px-4">{day.potatoInventory}</td>
                          <td className="py-2 px-4">{day.finishedGoodsInventory}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="financial" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left">Day</th>
                        <th className="py-2 px-4 text-left">Cash</th>
                        <th className="py-2 px-4 text-left">Revenue</th>
                        <th className="py-2 px-4 text-left">Profit</th>
                        <th className="py-2 px-4 text-left">Cumulative Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedData.map((day: any) => (
                        <tr key={day.day} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">Day {day.day}</td>
                          <td className="py-2 px-4">${day.cash.toFixed(2)}</td>
                          <td className="py-2 px-4">${day.revenue.toFixed(2)}</td>
                          <td className="py-2 px-4">${day.profit.toFixed(2)}</td>
                          <td className="py-2 px-4">${day.cumulativeProfit.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="production" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left">Day</th>
                        <th className="py-2 px-4 text-left">Production</th>
                        <th className="py-2 px-4 text-left">Sales</th>
                        <th className="py-2 px-4 text-left">Efficiency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedData.map((day: any) => (
                        <tr key={day.day} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">Day {day.day}</td>
                          <td className="py-2 px-4">{day.production} units</td>
                          <td className="py-2 px-4">{day.sales} units</td>
                          <td className="py-2 px-4">
                            {day.production > 0 ? `${((day.sales / day.production) * 100).toFixed(1)}%` : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="costs" className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left">Day</th>
                        <th className="py-2 px-4 text-left">Purchase Costs</th>
                        <th className="py-2 px-4 text-left">Production Costs</th>
                        <th className="py-2 px-4 text-left">Holding Costs</th>
                        <th className="py-2 px-4 text-left">Total Costs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedData.map((day: any) => (
                        <tr key={day.day} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">Day {day.day}</td>
                          <td className="py-2 px-4">${day.purchaseCosts.toFixed(2)}</td>
                          <td className="py-2 px-4">${day.productionCosts.toFixed(2)}</td>
                          <td className="py-2 px-4">${day.holdingCosts.toFixed(2)}</td>
                          <td className="py-2 px-4">${day.totalCosts.toFixed(2)}</td>
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
