"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { GameLevels } from "@/components/dashboard/game-levels"
import { Leaderboard } from "@/components/dashboard/leaderboard"
import { useAuth } from "@/lib/auth-context"
import { getLeaderboard } from "@/lib/actions/leaderboard-actions"

// Mock leaderboard data for immediate rendering while data is loading
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

export default function StudentDashboard() {
	const { user, loading } = useAuth()
	const router = useRouter()
	const [leaderboardData, setLeaderboardData] = useState(initialLeaderboardData)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Function to fetch leaderboard data
	const fetchLeaderboardData = async () => {
		try {
			setError(null)
			const data = await getLeaderboard()
			setLeaderboardData(data)
		} catch (error) {
			console.error("Error fetching leaderboard:", error)
			setError("Failed to load leaderboard data.")
			setLeaderboardData([]) // No fallback/mock data
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		if (!loading) {
			if (!user) {
				router.push("/auth/signin")
			} else if (user.role !== "student") {
				router.push("/dashboard/teacher")
			} else {
				// Fetch leaderboard data
				fetchLeaderboardData()
			}
		}
	}, [user, loading, router])

	// Add window focus event listener to refresh data when returning to the dashboard
	useEffect(() => {
		const handleFocus = () => {
			if (user && !isLoading) {
				fetchLeaderboardData()
			}
		}

		window.addEventListener('focus', handleFocus)
		return () => window.removeEventListener('focus', handleFocus)
	}, [user, isLoading])

	if (loading || isLoading || !user) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-[#e6f0ff]">
				<div className="text-[#0066cc] text-lg font-medium">Loading...</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 md:flex-row">
				<div className="flex-1">
					<h1 className="text-2xl font-bold text-[#003366]">Student Dashboard</h1>
					<p className="text-gray-500">Welcome back, {user.username}! Continue your logistics journey.</p>
					{error && <p className="text-amber-500 mt-2">{error}</p>}
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<GameLevels currentLevel={user.progress || 0} isTeacher={false} />
				<Leaderboard data={leaderboardData} currentUser={user.id} />
			</div>
		</div>
	)
}
