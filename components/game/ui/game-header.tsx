"use client"

import { useRouter } from "next/navigation"
import { Target, BookOpen, RotateCcw } from "lucide-react"
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
import { SaveStatus } from "./save-status"
import { ManualSaveStatus } from "./manual-save-status"
import { ResetLevelDialog } from "./reset-level-dialog"
import type { LevelConfig } from "@/types/game"
import type { GameHeaderProps } from "@/types/components"

export function GameHeader({ levelId, levelConfig, onShowObjectives, onShowTutorial, saveStatus, onSave, onResetLevel }: GameHeaderProps) {
  const router = useRouter()
  const [showExitConfirmation, setShowExitConfirmation] = useState(false)
  const [showResetConfirmation, setShowResetConfirmation] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

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

  const handleResetLevel = async () => {
    if (!onResetLevel) return

    setIsResetting(true)
    try {
      await onResetLevel()
    } catch (error) {
      console.error("Reset level failed:", error)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-900 border-b p-4 sticky top-0 z-10 level-header" data-tutorial="game-header">
        {/* Save Status Row - positioned above the level title */}
        {saveStatus && onSave && (
          <div className="mb-4">
            <ManualSaveStatus
              isSaving={saveStatus.isSaving}
              lastSaved={saveStatus.lastSaved}
              isDirty={saveStatus.isDirty}
              isLoadingState={saveStatus.isLoadingState}
              onSave={onSave}
            />
          </div>
        )}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Level {levelId}: {getLevelTitle()}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">{getLevelDescription()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExitClick}>
              Exit Game
            </Button>
            {onResetLevel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetConfirmation(true)}
                className="text-red-600 hover:text-red-700 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Level
              </Button>
            )}
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

      {/* Reset Level Confirmation Dialog */}
      <ResetLevelDialog
        open={showResetConfirmation}
        onOpenChange={setShowResetConfirmation}
        levelId={levelId}
        levelTitle={getLevelTitle()}
        onConfirm={handleResetLevel}
        isResetting={isResetting}
      />
    </>
  )
}
