"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
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

  // Calculate aggregate statistics
  const totalStudents = performanceData.length
  const studentsWhoPlayed = performanceData.filter(student => student.hasPlayedLevel).length
  const completedStudents = performanceData.filter(student => student.isCompleted).length
  const avgProfit = studentsWhoPlayed > 0
    ? performanceData
      .filter(student => student.hasPlayedLevel)
      .reduce((sum, student) => sum + student.maxProfit, 0) / studentsWhoPlayed
    : 0
  const maxProfitStudent = performanceData.reduce((max, student) =>
    student.maxProfit > max.maxProfit ? student : max, { maxProfit: -Infinity, username: 'N/A' })
  const avgScore = studentsWhoPlayed > 0
    ? performanceData
      .filter(student => student.hasPlayedLevel)
      .reduce((sum, student) => sum + student.maxScore, 0) / studentsWhoPlayed
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Level {levelId} Overview</h1>
        <p className="text-gray-500">Aggregate statistics for all students in Level {levelId}.</p>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-500">Total Students</h3>
          <p className="text-2xl font-bold">{totalStudents}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-500">Students Who Played</h3>
          <p className="text-2xl font-bold">{studentsWhoPlayed}</p>
          <p className="text-sm text-gray-400">{totalStudents > 0 ? Math.round((studentsWhoPlayed / totalStudents) * 100) : 0}% participation</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-500">Completed Level</h3>
          <p className="text-2xl font-bold">{completedStudents}</p>
          <p className="text-sm text-gray-400">{studentsWhoPlayed > 0 ? Math.round((completedStudents / studentsWhoPlayed) * 100) : 0}% completion rate</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-500">Average Score</h3>
          <p className="text-2xl font-bold">{Math.round(avgScore)}</p>
        </div>
      </div>

      {/* Performance Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Profit Statistics</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Average Profit</span>
              <p className="text-xl font-bold">
                {new Intl.NumberFormat("sv-SE", {
                  style: "currency",
                  currency: "SEK",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(avgProfit)}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Best Performance</span>
              <p className="text-xl font-bold">
                {maxProfitStudent.maxProfit > -Infinity
                  ? new Intl.NumberFormat("sv-SE", {
                    style: "currency",
                    currency: "SEK",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(maxProfitStudent.maxProfit)
                  : "—"}
              </p>
              <p className="text-sm text-gray-400">by {maxProfitStudent.username}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Student Access</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">View Individual Performance</span>
              <p className="text-sm text-gray-600 mb-3">Select a student to view detailed analytics</p>
              <StudentSelector initialStudents={students} selectedStudentId={""} levelId={levelId} />
            </div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Student Performance List</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Student</th>
                <th className="text-left py-2">Status</th>
                <th className="text-right py-2">Score</th>
                <th className="text-right py-2">Profit</th>
                <th className="text-center py-2">Days Played</th>
                <th className="text-center py-2">Completed</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((student) => (
                <tr key={student.userId} className="border-b hover:bg-gray-50">
                  <td className="py-2 font-medium">{student.username}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${student.hasPlayedLevel
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                      }`}>
                      {student.hasPlayedLevel ? 'Played' : 'Not Started'}
                    </span>
                  </td>
                  <td className="py-2 text-right">{student.hasPlayedLevel ? student.maxScore : '—'}</td>
                  <td className="py-2 text-right">
                    {student.hasPlayedLevel
                      ? new Intl.NumberFormat("sv-SE", {
                        style: "currency",
                        currency: "SEK",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(student.maxProfit)
                      : '—'
                    }
                  </td>
                  <td className="py-2 text-center">{student.hasPlayedLevel ? student.currentDay : '—'}</td>
                  <td className="py-2 text-center">
                    {student.hasPlayedLevel && student.isCompleted ? '✓' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
