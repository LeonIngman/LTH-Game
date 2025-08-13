"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingScreen, InlineLoadingScreen } from "@/components/ui/loading-screen"
import { getQuizResults } from "@/lib/actions/quiz-actions"
import { ArrowLeft } from "lucide-react"

interface TeacherQuizPageProps {
  params: {
    levelId: string
  }
}

export default function TeacherQuizPage({ params }: TeacherQuizPageProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const levelId = Number.parseInt(params.levelId)
  const [quizResults, setQuizResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/signin")
      } else if (user.role !== "teacher") {
        router.push("/dashboard/student")
      } else {
        fetchQuizResults()
      }
    }
  }, [user, loading, router])

  const fetchQuizResults = async () => {
    try {
      const results = await getQuizResults(levelId)
      setQuizResults(results)
    } catch (error) {
      console.error("Error fetching quiz results:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || !user) {
    return <LoadingScreen message="Loading quiz results..." description="Fetching student submissions and answers" />
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.push("/dashboard/teacher")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-[#003366] mb-2">Level {levelId} Quiz Results</h1>
        <p className="text-gray-600">Review student quiz submissions</p>
      </div>

      {isLoading ? (
        <InlineLoadingScreen message="Loading quiz results..." size="lg" />
      ) : quizResults.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">No quiz submissions found for Level {levelId}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {quizResults.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{result.username}</CardTitle>
                <CardDescription>Submitted: {new Date(result.submittedAt).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Question 1: Upstream Supply Chain Components</h4>
                    <p className="text-sm text-gray-600">Selected: {result.answers.q1?.join(", ") || "No answer"}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Question 2: Input-Process-Output Model</h4>
                    <div className="text-sm text-gray-600">
                      {Object.entries(result.answers.q2 || {}).map(([item, category]) => (
                        <p key={item}>
                          {item}: {category}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Question 3: True/False Questions</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      {Object.entries(result.answers.q3 || {}).map(([question, answer]: [string, any]) => (
                        <div key={question}>
                          <p className="font-medium">{question}</p>
                          <p>Answer: {answer.answer}</p>
                          <p>Justification: {answer.justification}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Question 4: Logistics Metric</h4>
                    <p className="text-sm text-gray-600">{result.answers.q4 || "No answer"}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Question 5: Production Strategy Matching</h4>
                    <div className="text-sm text-gray-600">
                      {Object.entries(result.answers.q5 || {}).map(([description, match]: [string, any]) => (
                        <p key={description}>
                          {description.substring(0, 50)}... → {match.strategy} / {match.example}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Question 6: Production Strategy Analysis</h4>
                    <p className="text-sm text-gray-600">{result.answers.q6 || "No answer"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
