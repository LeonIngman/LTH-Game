"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { saveGameResults } from "@/lib/actions/game-actions"
import type { LevelConfig } from "@/types/game"
type GameState = any
import { calculateGameResult } from "@/lib/game/engine"
import { InfoIcon } from "lucide-react"

interface GameOverDialogProps {
  isOpen: boolean
  onClose: () => void
  gameState: GameState
  levelConfig: LevelConfig
  userId: string
  onSubmitLevel: () => Promise<void>
  isSubmitting: boolean
}

export function GameOverDialog({
  isOpen,
  onClose,
  gameState,
  levelConfig,
  userId,
  onSubmitLevel,
  isSubmitting,
}: GameOverDialogProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Calculate final results
  const gameResult = calculateGameResult(gameState, levelConfig, userId)
  const { score, finalCash, cumulativeProfit } = gameResult

  // Format currency values (Swedish Kronor)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  // Handle save button click
  const handleSaveResults = async () => {
    try {
      setIsSaving(true)
      setSaveSuccess(null)
      setSaveError(null)

      // Save the game results to the database
      const result = await saveGameResults(userId, levelConfig.id, gameState)

      if (result.success) {
        setSaveSuccess(true)
        // Wait a moment before redirecting
        setTimeout(() => {
          router.push("/dashboard/student")
        }, 2000)
      } else {
        setSaveError(result.error || "Failed to save results")
        setSaveSuccess(false)
      }
    } catch (error) {
      console.error("Error saving game results:", error)
      setSaveError(String(error) || "An unexpected error occurred")
      setSaveSuccess(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl">Game Over!</AlertDialogTitle>
          <AlertDialogDescription>
            You have completed Level {levelConfig.id}: {levelConfig.name}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Final Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex flex-col items-center justify-center rounded-lg bg-muted p-4">
                  <span className="text-sm font-medium text-muted-foreground">Final Cash</span>
                  <span className="text-2xl font-bold">{formatCurrency(finalCash)}</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-muted p-4">
                  <span className="text-sm font-medium text-muted-foreground">Total Profit</span>
                  <span className="text-2xl font-bold">{formatCurrency(cumulativeProfit)}</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-muted p-4">
                  <span className="text-sm font-medium text-muted-foreground">Final Score</span>
                  <span className="text-2xl font-bold">{score}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Inventory Summary</h3>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                  <div className="rounded-md bg-background p-2 text-center">
                    <div className="text-xs text-muted-foreground">Patties</div>
                    <div className="font-medium">{gameState.inventory.patty}</div>
                  </div>
                  <div className="rounded-md bg-background p-2 text-center">
                    <div className="text-xs text-muted-foreground">Buns</div>
                    <div className="font-medium">{gameState.inventory.bun}</div>
                  </div>
                  <div className="rounded-md bg-background p-2 text-center">
                    <div className="text-xs text-muted-foreground">Cheese</div>
                    <div className="font-medium">{gameState.inventory.cheese}</div>
                  </div>
                  <div className="rounded-md bg-background p-2 text-center">
                    <div className="text-xs text-muted-foreground">Potatoes</div>
                    <div className="font-medium">{gameState.inventory.potato}</div>
                  </div>
                  <div className="rounded-md bg-background p-2 text-center">
                    <div className="text-xs text-muted-foreground">Finished Meals</div>
                    <div className="font-medium">{gameState.inventory.finishedGoods}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {saveSuccess === true && (
            <div className="rounded-md bg-green-50 p-4 text-green-800">
              {"Game results saved successfully!"}{" "}
              Redirecting to dashboard...
            </div>
          )}

          {saveSuccess === false && (
            <div className="rounded-md bg-red-50 p-4 text-red-800">Failed to save game results: {saveError}</div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>Close</AlertDialogCancel>
          <Button
            onClick={handleSaveResults}
            disabled={isSaving || saveSuccess === true}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? "Saving..." : "Save Results"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
