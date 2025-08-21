"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { PerformanceSummary } from "@/components/performance/performance-summary"
import { StudentSelector } from "@/components/performance/student-selector"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { getAllStudents } from "@/lib/actions/user-actions"
import { getAllStudentsPerformance } from "@/lib/actions/performance-actions"

export default function TeacherPerformancePage({ params }: { params: Promise<{ levelId: string }> }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Unwrap params using React.use()
  const { levelId: levelIdRaw } = use(params)
  const levelId = Number.parseInt(levelIdRaw)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      try {
        const allStudents = await getAllStudents()

        setStudents(
          allStudents.map((student: any) => ({
            userId: student.id,
            username: student.username,
            maxScore: student.maxScore ?? 0,
            maxProfit: student.maxProfit ?? 0,
          }))
        )

        const perfData = await getAllStudentsPerformance(levelId)

        setPerformanceData(perfData)
      } catch (error) {
        console.error("Error fetching performance data:", error)
        setPerformanceData([])
      } finally {
        setIsLoading(false)
      }
    }

    if (!loading) {
      if (!user) {
        router.push("/auth/signin")
      } else if (user.role !== "teacher") {
        router.push("/dashboard/student")
      } else if (isNaN(levelId) || levelId < 0 || levelId > 3) {
        router.push("/dashboard/teacher")
      } else {
        // Fetch students and performance data
        fetchData()
      }
    }
  }, [user, loading, router, levelId])

  if (loading || isLoading || !user) {
    return <LoadingScreen message="Loading performance data..." description="Analyzing student progress for this level" />
  }

  // Pick a student to show summary for (e.g. the first one with data)
  const selectedPerformance = performanceData[0] || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Level {levelId} Performance</h1>
        <p className="text-gray-500">View and analyze student performance for Level {levelId}.</p>
      </div>
      <StudentSelector initialStudents={students} selectedStudentId={""} levelId={levelId} />
      <PerformanceSummary
        levelName={selectedPerformance.levelName ?? `Level ${levelId}`}
        maxScore={selectedPerformance.maxScore ?? 0}
        currentScore={selectedPerformance.maxScore ?? 0}
        profit={selectedPerformance.maxProfit ?? 0}
        username={selectedPerformance.username}
      />
    </div>
  )
}
