"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { GameLevels } from "@/components/dashboard/game-levels"
import { Leaderboard } from "@/components/dashboard/leaderboard"
import { StudentManagement } from "@/components/dashboard/student-management"
import { useAuth } from "@/lib/auth-context"
import { getLeaderboard } from "@/lib/actions/leaderboard-actions"
import { getAllStudents } from "@/lib/actions/user-actions"

// Initial loading placeholders
const initialLeaderboardData = [
  {
    id: "loading-1",
    username: "Loading...",
    progress: 0,
    profit: 0,
    level: 0,
    lastActive: "Loading...",
  },
  {
    id: "loading-2",
    username: "Loading...",
    progress: 0,
    profit: 0,
    level: 0,
    lastActive: "Loading...",
  },
]

const initialStudentsData = [
  {
    id: "loading-1",
    username: "Loading...",
    visible_password: "********",
    progress: 0,
    lastActive: "Loading...",
  },
  {
    id: "loading-2",
    username: "Loading...",
    visible_password: "********",
    progress: 0,
    lastActive: "Loading...",
  },
]

export default function TeacherDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [leaderboardData, setLeaderboardData] = useState(initialLeaderboardData)
  const [students, setStudents] = useState(initialStudentsData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataFetched, setDataFetched] = useState(false)

  useEffect(() => {
    if (!loading && !dataFetched) {
      if (!user) {
        router.push("/auth/signin")
      } else if (user.role !== "teacher") {
        router.push("/dashboard/student")
      } else {
        setDataFetched(true)
        const fetchData = async () => {
          try {
            const [leaderboard, studentsList] = await Promise.all([getLeaderboard(), getAllStudents()])
            setLeaderboardData(leaderboard)
            setStudents(studentsList)
          } catch (error) {
            console.error("Error fetching data:", error)
            setError("Failed to load data.")
            setLeaderboardData(initialLeaderboardData)
            setStudents(initialStudentsData)
          } finally {
            setIsLoading(false)
          }
        }
        fetchData()
      }
    }
  }, [user, loading, router, dataFetched])

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (loading || isLoading || !user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user.username}! Monitor student progress and manage accounts.</p>
          {error && <p className="text-amber-500 mt-2">{error}</p>}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <GameLevels currentLevel={3} isTeacher={true} />
        <Leaderboard data={leaderboardData} />
      </div>

      <StudentManagement students={students} />
    </div>
  )
}
