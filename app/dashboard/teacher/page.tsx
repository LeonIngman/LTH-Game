"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { GameLevels } from "@/components/dashboard/game-levels"
import { Leaderboard } from "@/components/dashboard/leaderboard"
import { StudentManagement } from "@/components/dashboard/student-management"
import { useAuth } from "@/lib/auth-context"
import { getLeaderboard } from "@/lib/actions/leaderboard-actions"
import { getAllStudents } from "@/lib/actions/user-actions"
import { isV0Preview, shouldUseDemoMode } from "@/lib/v0-detection"

// Mock data for immediate rendering while data is loading
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

// Mock student data for demo mode
const mockStudentsData = [
  {
    id: "demo-student-1",
    username: "TopStudent",
    visible_password: "password123",
    progress: 3,
    lastActive: new Date().toLocaleDateString(),
  },
  {
    id: "demo-student-2",
    username: "LogisticsWiz",
    visible_password: "password123",
    progress: 3,
    lastActive: new Date().toLocaleDateString(),
  },
  {
    id: "demo-student-3",
    username: "SupplyChainMaster",
    visible_password: "password123",
    progress: 2,
    lastActive: new Date().toLocaleDateString(),
  },
  {
    id: "demo-student-4",
    username: "InventoryPro",
    visible_password: "password123",
    progress: 2,
    lastActive: new Date().toLocaleDateString(),
  },
  {
    id: "demo-student-5",
    username: "ShippingExpert",
    visible_password: "password123",
    progress: 1,
    lastActive: new Date().toLocaleDateString(),
  },
]

// Mock leaderboard data with profit information
const mockLeaderboardWithProfit = [
  {
    id: "demo-student-1",
    username: "TopStudent",
    progress: 3,
    profit: 85000,
    level: 2,
    lastActive: new Date().toLocaleDateString(),
  },
  {
    id: "demo-student-2",
    username: "LogisticsWiz",
    progress: 3,
    profit: 72500,
    level: 2,
    lastActive: new Date().toLocaleDateString(),
  },
  {
    id: "demo-student-3",
    username: "SupplyChainMaster",
    progress: 2,
    profit: 63000,
    level: 1,
    lastActive: new Date().toLocaleDateString(),
  },
  {
    id: "demo-student-4",
    username: "InventoryPro",
    progress: 2,
    profit: 58200,
    level: 1,
    lastActive: new Date().toLocaleDateString(),
  },
  {
    id: "demo-student-5",
    username: "ShippingExpert",
    progress: 1,
    profit: 42000,
    level: 0,
    lastActive: new Date().toLocaleDateString(),
  },
]

export default function TeacherDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [leaderboardData, setLeaderboardData] = useState(initialLeaderboardData)
  const [students, setStudents] = useState(initialStudentsData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataFetched, setDataFetched] = useState(false) // Add this to prevent multiple fetches

  useEffect(() => {
    // Only proceed if auth is not loading and we haven't fetched data yet
    if (!loading && !dataFetched) {
      if (!user) {
        router.push("/auth/signin")
      } else if (user.role !== "teacher") {
        router.push("/dashboard/student")
      } else {
        // Mark data as being fetched to prevent multiple fetches
        setDataFetched(true)

        // Fetch data
        const fetchData = async () => {
          try {
            // If in demo mode or v0 preview, use mock data
            if (shouldUseDemoMode() || isV0Preview()) {
              // Simulate a delay for loading state
              setTimeout(() => {
                setLeaderboardData(mockLeaderboardWithProfit)
                setStudents(mockStudentsData)
                setIsLoading(false)
              }, 1000)
              return
            }

            // Otherwise, fetch real data
            const [leaderboard, studentsList] = await Promise.all([getLeaderboard(), getAllStudents()])
            setLeaderboardData(leaderboard)
            setStudents(studentsList)
          } catch (error) {
            console.error("Error fetching data:", error)
            setError("Failed to load data. Using demo data instead.")

            // Fall back to mock data
            setLeaderboardData(mockLeaderboardWithProfit)
            setStudents(mockStudentsData)

            // If in v0.dev preview, don't show error
            if (isV0Preview() || shouldUseDemoMode()) {
              setError(null)
            }
          } finally {
            setIsLoading(false)
          }
        }
        fetchData()
      }
    }
  }, [user, loading, router, dataFetched]) // Add dataFetched to dependencies

  // For v0.dev preview, reduce loading time
  useEffect(() => {
    if ((isV0Preview() || shouldUseDemoMode()) && isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false)
        setLeaderboardData(mockLeaderboardWithProfit)
        setStudents(mockStudentsData)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isLoading]) // Only depend on isLoading

  if (loading || (isLoading && !isV0Preview() && !shouldUseDemoMode()) || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
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
