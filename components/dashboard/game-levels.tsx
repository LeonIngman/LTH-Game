"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, BarChart3, CheckCircle, Lock, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { checkExistingPerformance } from "@/lib/actions/game-actions"
import { ReplayWarningDialog } from "@/components/game/replay-warning-dialog"
import Link from "next/link"

interface GameLevelsProps {
  currentLevel?: number
  isTeacher?: boolean
  levels?: Array<{
    id: number
    name?: string
    title?: string
    description: string
    maxScore?: number
  }>
  userProgress?: number
  userId?: string
}

export function GameLevels({
  currentLevel,
  isTeacher = false,
  levels: propLevels,
  userProgress,
  userId,
}: GameLevelsProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // For backward compatibility
  const effectiveCurrentLevel = currentLevel ?? userProgress ?? 0
  const effectiveUserId = userId ?? "current-user"

  // Define default levels if not provided
  const defaultLevels = [
    {
      id: 0,
      title: "The First Spark",
      description: "Learn the fundamentals of restaurant management",
    },
    {
      id: 1,
      title: "Timing is Everything",
      description: "Manage your burger restaurant supply chain",
    },
    {
      id: 2,
      title: "Forecast the Future",
      description: "Analyze trends and predict customer demand",
    },
    {
      id: 3,
      title: "Uncertainty Unleashed",
      description: "Navigate complex supply chains with variable market conditions",
    },
  ]

  // Use provided levels or default levels
  const effectiveLevels = propLevels ?? defaultLevels

  // State for replay warning dialog
  const [warningDialogOpen, setWarningDialogOpen] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [existingScore, setExistingScore] = useState(0)
  const [existingProfit, setExistingProfit] = useState(0)
  const [checkingLevel, setCheckingLevel] = useState<number | null>(null)

  const handleLevelClick = async (levelId: number) => {
    if (levelId > effectiveCurrentLevel + 1 && !isTeacher) {
      toast({
        title: "Level locked",
        description: "You need to complete previous levels first",
      })
      return
    }

    setCheckingLevel(levelId)

    try {
      const result = await checkExistingPerformance(effectiveUserId, levelId)

      if (result.exists) {
        setSelectedLevel(levelId)
        setExistingScore(result.score)
        setExistingProfit(result.profit)
        setWarningDialogOpen(true)
      } else {
        router.push(`/game/${levelId}`)
      }
    } catch (error) {
      console.error("Error checking performance:", error)
      router.push(`/game/${levelId}`)
    } finally {
      setCheckingLevel(null)
    }
  }

  const handleConfirmReplay = () => {
    setWarningDialogOpen(false)
    if (selectedLevel !== null) {
      router.push(`/game/${selectedLevel}`)
    }
  }

  const handleQuizClick = (levelId: number) => {
    if (levelId > effectiveCurrentLevel + 1 && !isTeacher) {
      toast({
        title: "Quiz locked",
        description: "You need to complete previous levels first",
      })
      return
    }

    if (isTeacher) {
      router.push(`/dashboard/teacher/quiz/${levelId}`)
    } else {
      router.push(`/quiz/${levelId}`)
    }
  }

  return (
    <>
      <Card className="border-[#4d94ff] bg-white">
        <CardHeader className="border-b border-[#4d94ff]">
          <CardTitle>Game Levels</CardTitle>
          <CardDescription>Progress through all levels to master logistics concepts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          {effectiveLevels.map((level) => {
            const levelId = level.id
            const isCompleted = effectiveCurrentLevel > levelId
            const isLocked = levelId > effectiveCurrentLevel + 1 && !isTeacher

            return (
              <div
                key={levelId}
                className={`flex items-center gap-4 rounded-lg border ${isLocked ? "border-gray-200" : "border-[#4d94ff]"} p-4 ${isLocked ? "opacity-60" : ""}`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isCompleted
                      ? "bg-green-100 text-green-600"
                      : isLocked
                        ? "bg-gray-100 text-gray-400"
                        : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : isLocked ? (
                    <Lock className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{levelId}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{level.title ?? (level as any).name ?? `Level ${levelId}`}</h3>
                  <p className="text-sm text-gray-500">{level.description}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={
                      isTeacher
                        ? `/dashboard/teacher/performance/${levelId}`
                        : `/dashboard/student/performance/${levelId}`
                    }
                  >
                    <Button variant="outline" size="sm" className="border-[#4d94ff]">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Performance
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLocked}
                    onClick={() => handleQuizClick(levelId)}
                    className="border-[#4d94ff]"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Quiz
                  </Button>
                  <Button
                    variant={isLocked ? "outline" : "default"}
                    size="sm"
                    disabled={isLocked || checkingLevel === levelId}
                    onClick={() => handleLevelClick(levelId)}
                    className={isLocked ? "" : "bg-[#0066cc] hover:bg-[#003366]"}
                  >
                    {checkingLevel === levelId ? (
                      "Checking..."
                    ) : (
                      <>
                        {isCompleted ? "Replay" : "Start"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {selectedLevel !== null && (
        <ReplayWarningDialog
          isOpen={warningDialogOpen}
          onClose={() => setWarningDialogOpen(false)}
          onConfirm={handleConfirmReplay}
          levelName={
            (() => {
              const found = effectiveLevels.find((l) => l.id === selectedLevel)
              return found
                ? ("name" in found && found.name ? found.name : found.title ?? `Level ${selectedLevel}`)
                : `Level ${selectedLevel}`
            })()
          }
          existingScore={existingScore}
          existingProfit={existingProfit}
        />
      )}
    </>
  )
}
