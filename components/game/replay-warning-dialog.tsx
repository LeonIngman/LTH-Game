"use client"

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

interface ReplayWarningDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  levelName: string
  existingScore: number
  existingProfit: number
}

export function ReplayWarningDialog({
  isOpen,
  onClose,
  onConfirm,
  levelName,
  existingScore,
  existingProfit,
}: ReplayWarningDialogProps) {
  // Simple currency formatter function
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Replay {levelName}?</AlertDialogTitle>
          <AlertDialogDescription>
            You have already completed this level with the following results:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 space-y-2">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="font-medium">Score:</span>
            <span className="text-blue-600 font-bold">{existingScore} points</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Profit:</span>
            <span className="text-green-600 font-bold">{formatCurrency(existingProfit)}</span>
          </div>
          <div className="mt-4 text-red-500 font-medium">
            Starting a new game will erase your previous progress for this level.
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Start New Game</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
