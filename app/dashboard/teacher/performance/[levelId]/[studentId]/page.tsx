"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, BarChart3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DailyProgress } from "@/components/performance/daily-progress"
import { PerformanceSummary } from "@/components/performance/performance-summary"
import { StudentSelector } from "@/components/performance/student-selector"
import { useAuth } from "@/lib/auth-context"
import { getAllStudentsPerformance, getGameLevels, getGameSessionData } from "@/lib/actions/performance-actions"

export default function TeacherStudentPerformancePage({
  params,
}: {
  params: Promise<{ levelId: string; studentId: string }>
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Unwrap params using React.use() for Next.js 15+ compatibility
  const { levelId: levelIdParam, studentId } = use(params)

  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [levelInfo, setLevelInfo] = useState<any>(null)
  const [studentsList, setStudentsList] = useState<any[]>([])
  const [studentInfo, setStudentInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Parse the level ID and validate it
  const levelId = Number.parseInt(levelIdParam, 10)

  // Check if levelId is valid (0, 1, 2, or 3)
  const isValidLevelId = !isNaN(levelId) && levelId >= 0 && levelId <= 3
  const hasValidParams = isValidLevelId && studentId?.trim()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/signin")
        return
      } else if (user.role !== "teacher") {
        router.push("/dashboard/student")
        return
      }

      // If invalid level ID or student ID, show error
      if (!hasValidParams) {
        setError("Invalid level ID or student ID. Please select a valid level and student.")
        setIsLoading(false)
        return
      }

      const fetchData = async () => {
        try {
          // Get level info
          const levels = await getGameLevels()
          const currentLevel = levels.find((level: any) => level.id === levelId)

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

          // Get all students performance
          const studentsPerformance = await getAllStudentsPerformance(levelId)
          setStudentsList(studentsPerformance || [])

          // Find current student
          const currentStudent = studentsPerformance?.find((s: any) => s.userId === studentId)
          setStudentInfo(currentStudent || null)

          // Get student performance data
          if (currentStudent) {
            const performance = await getGameSessionData(studentId, levelId)
            // Sort by day in descending order (latest day first)
            const sortedPerformance = (performance || []).sort((a: any, b: any) => (b.day || 0) - (a.day || 0))
            setPerformanceData(sortedPerformance)
          }
        } catch (error) {
          console.error("Error fetching performance data:", error)
          setError("Failed to load performance data. Please try again later.")
        } finally {
          setIsLoading(false)
        }
      }

      fetchData()
    }
  }, [user, loading, router, levelId, studentId, hasValidParams])

  // Calculate current score and profit from GameSession history data
  const currentScore = performanceData.length > 0 ?
    (performanceData[performanceData.length - 1]?.score || 0) : 0
  const totalProfit = performanceData.length > 0 ?
    (performanceData[performanceData.length - 1]?.cumulativeProfit || 0) : 0

  if (loading || (isLoading && !error) || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  // Validate levelId and studentId
  if (!hasValidParams) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/dashboard/teacher"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-2">Student Performance Analytics</h1>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <BarChart3 className="h-10 w-10 text-amber-400" />
          <h3 className="mt-4 text-lg font-semibold text-amber-600">Invalid Parameters</h3>
          <p className="mt-2 text-sm text-gray-500">
            Level ID "{levelIdParam}" or Student ID "{studentId}" is not valid.
          </p>
          <Button onClick={() => router.push("/dashboard/teacher")} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Handle error state  
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/dashboard/teacher"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-2">Student Performance Analytics</h1>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <BarChart3 className="h-10 w-10 text-amber-400" />
          <h3 className="mt-4 text-lg font-semibold text-amber-600">{error}</h3>
          <p className="mt-2 text-sm text-gray-500">Please return to the dashboard and try again.</p>
          <Button onClick={() => router.push("/dashboard/teacher")} className="mt-4">
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
            href="/dashboard/teacher"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-2">Student Performance Analytics</h1>
          <p className="text-gray-500">Level: {levelInfo?.name}</p>
        </div>

        <StudentSelector initialStudents={studentsList} selectedStudentId={studentId} levelId={levelId} />
      </div>

      {performanceData.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <PerformanceSummary
              levelName={levelInfo?.name}
              maxScore={levelInfo?.maxScore}
              currentScore={currentScore}
              profit={Number(totalProfit)}
              username={studentInfo?.username}
            />
          </div>
          <div className="md:col-span-2">
            <DailyProgress dailyData={performanceData} isLoading={false} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <h3 className="mt-4 text-lg font-semibold">No Performance Data</h3>
          <p className="mt-2 text-sm text-gray-500">
            {studentInfo?.username || "This student"} hasn't completed any gameplay for this level yet.
          </p>
        </div>
      )}
    </div>
  )
}
