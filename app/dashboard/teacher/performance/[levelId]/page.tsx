"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { PerformanceSummary } from "@/components/performance/performance-summary"
import { StudentSelector } from "@/components/performance/student-selector"
import { getAllStudents } from "@/lib/actions/user-actions"
import { getPerformanceData } from "@/lib/actions/performance-actions"

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, router, levelId])

  // When setting students, map to correct shape:
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const allStudents = await getAllStudents()
      setStudents(
        allStudents.map((student: any) => ({
          userId: student.id, // <-- ensure this is userId
          username: student.username,
          maxScore: student.maxScore ?? 0,     // fallback if missing
          maxProfit: student.maxProfit ?? 0,   // fallback if missing
        }))
      )
      const perfData = await getPerformanceData(levelId)
      setPerformanceData(perfData)
    } catch (error) {
      // Optionally handle error
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Level {levelId} Performance</h1>
        <p className="text-gray-500">View and analyze student performance for Level {levelId}.</p>
      </div>
      <StudentSelector initialStudents={students} selectedStudentId={""} levelId={levelId} />
      <PerformanceSummary performanceData={performanceData} levelId={levelId} />
    </div>
  )
}
