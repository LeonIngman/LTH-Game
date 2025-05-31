"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { QuizLevel0 } from "@/components/quiz/quiz-level-0"

interface QuizPageProps {
  params: {
    levelId: string
  }
}

export default function QuizPage({ params }: QuizPageProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const levelId = Number.parseInt(params.levelId)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin")
    }
  }, [user, loading, router])

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  const renderQuiz = () => {
    switch (levelId) {
      case 0:
        return <QuizLevel0 userId={user.id} />
      default:
        return (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Quiz Not Available</h1>
              <p className="text-gray-600">Quiz for Level {levelId} is not yet available.</p>
            </div>
          </div>
        )
    }
  }

  return <div className="min-h-screen bg-gradient-to-b from-white to-[#e6f0ff]">{renderQuiz()}</div>
}
