"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { useAuth } from "@/lib/auth-context"
import { QuizLevel0 } from "@/components/quiz/quiz-level-0"

interface QuizPageProps {
  params: Promise<{
    levelId: string
  }>
}

export default function QuizPage({ params }: QuizPageProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // Unwrap params using React.use() for Next.js 15+ compatibility
  const { levelId: levelIdParam } = use(params)
  const levelId = Number.parseInt(levelIdParam, 10)

  // Validate levelId
  if (isNaN(levelId) || levelId < 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Invalid Level</h1>
          <p className="text-gray-600">The level ID "{levelIdParam}" is not valid.</p>
          <button 
            onClick={() => router.push("/dashboard/student")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Return to student dashboard"
          >
            Back to Levels
          </button>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin")
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600" role="status" aria-live="polite">
            {loading ? "Loading..." : "Redirecting to sign in..."}
          </p>
        </div>
      </div>
    )
  }

  const renderQuiz = () => {
    switch (levelId) {
      case 0:
        return <QuizLevel0 userId={user.id} />
      default:
        return (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold mb-4">Quiz Not Available</h1>
              <p className="text-gray-600">Quiz for Level {levelId} is not yet available.</p>
              <button 
                onClick={() => router.push("/dashboard/student")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Return to student dashboard"
              >
                Back to Levels
              </button>
            </div>
          </div>
        )
    }
  }

  return <div className="min-h-screen bg-gradient-to-b from-white to-[#e6f0ff]">{renderQuiz()}</div>
}
