"use client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { GameState, LevelConfig } from "@/types/game"
import { ChartDialog } from "../chart-dialog"
import { MapDialog } from "../map-dialog"
import { TutorialOverlay } from "../tutorial-overlay"

interface GameDialogsProps {
  gameState: GameState
  levelConfig: LevelConfig
  showChart: boolean
  setShowChart: (show: boolean) => void
  showMap: boolean
  setShowMap: (show: boolean) => void
  showTutorial: boolean
  setShowTutorial: (show: boolean) => void
  gameEnded: boolean
  setGameEnded: (ended: boolean) => void
  onSubmitLevel: () => Promise<void>
  isSubmitting: boolean
}

export function GameDialogs({
  gameState,
  levelConfig,
  showChart,
  setShowChart,
  showMap,
  setShowMap,
  showTutorial,
  setShowTutorial,
  gameEnded,
  setGameEnded,
  onSubmitLevel,
  isSubmitting,
}: GameDialogsProps) {
  return (
    <>
      {/* Chart Dialog */}
      <ChartDialog open={showChart} onOpenChange={setShowChart} gameHistory={gameState.history} />

      {/* Map Dialog */}
      <MapDialog
        open={showMap}
        onOpenChange={setShowMap}
        pendingOrders={gameState.pendingOrders}
        pendingCustomerOrders={gameState.customerDeliveries}
      />

      {/* Tutorial Overlay */}
      {showTutorial && (
        <TutorialOverlay
          steps={levelConfig.tutorialSteps || []}
          onComplete={() => setShowTutorial(false)}
          isOpen={showTutorial}
          onTabChange={() => {}}
        />
      )}

      {/* Game Over Dialog */}
      <Dialog open={gameEnded} onOpenChange={setGameEnded}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Game Over</DialogTitle>
            <DialogDescription>You have completed level {levelConfig.id}!</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>Congratulations on finishing the level. Your final score is {gameState.score}.</p>
          </div>
          <DialogFooter>
            <Button onClick={onSubmitLevel} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Results"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Game Over Dialog for Bankruptcy */}
      <Dialog open={gameState.gameOver === true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-red-600 font-bold">Game Over!</DialogTitle>
            <DialogDescription>You've run out of money and can't continue operations.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="font-medium">Final Results:</p>
              <p>Days completed: {gameState.day || 0}</p>
              <p>Final cash: {(gameState.cash || 0).toFixed(2)} kr</p>
              <p>Total profit: {(gameState.cumulativeProfit || 0).toFixed(2)} kr</p>
            </div>
            <p>You can review your game history and charts to see where things went wrong.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
