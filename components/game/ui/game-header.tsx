"use client"

import { useRouter } from "next/navigation"
import { Target, BookOpen } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { LevelConfig } from "@/types/game"

interface GameHeaderProps {
  levelId: number
  levelConfig: LevelConfig
  onShowObjectives: () => void
  onShowTutorial: () => void
}

export function GameHeader({ levelId, levelConfig, onShowObjectives, onShowTutorial }: GameHeaderProps) {
  const router = useRouter()
  const [showExitConfirmation, setShowExitConfirmation] = useState(false)

  // Get level-specific title and description
  const getLevelTitle = () => {
    switch (levelId) {
      case 0:
        return "The First Spark"
      case 1:
        return "Timing is Everything"
      case 2:
        return "Forecast the Future"
      case 3:
        return "Uncertainty Unleashed"
      default:
        return "Burger Restaurant Game"
    }
  }

  const getLevelDescription = () => {
    switch (levelId) {
      case 0:
        return "Learn the basics of supply and demand in a simple restaurant environment."
      case 1:
        return "Manage your burger restaurant supply chain with a fixed 2-day delivery time."
      case 2:
        return "Analyze trends and predict customer demand."
      case 3:
        return "Navigate complex supply chains with variable market conditions."
      default:
        return "Test your restaurant management skills."
    }
  }

  const handleExitClick = () => {
    setShowExitConfirmation(true)
  }

  const handleConfirmExit = () => {
    router.push(`/dashboard/student`)
  }

  const handleCancelExit = () => {
    setShowExitConfirmation(false)
  }

  return (
    <>
      <div className="bg-white border-b p-4 sticky top-0 z-10 level-header" data-tutorial="game-header">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Level {levelId}: {getLevelTitle()}
            </h1>
            <p className="text-gray-500">{getLevelDescription()}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExitClick}>
              Exit Game
            </Button>
            {levelId === 0 && (
              <Button variant="outline" size="sm" onClick={onShowTutorial}>
                <BookOpen className="mr-2 h-4 w-4" />
                View Tutorial
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onShowObjectives}>
              <Target className="mr-2 h-4 w-4" />
              Objectives
            </Button>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitConfirmation} onOpenChange={setShowExitConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Game?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to exit the game? All unsaved progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelExit}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExit} className="bg-red-600 hover:bg-red-700">
              Exit Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
