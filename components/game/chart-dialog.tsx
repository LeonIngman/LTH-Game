"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { InventoryChart } from "@/components/game/inventory-chart"
import { CashflowChart } from "@/components/game/cashflow-chart"
import type { DailyResult } from "@/types/game"

interface ChartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameHistory: DailyResult[]
  currentInventory?: any
  currentDay?: number
}

export function ChartDialog({ open, onOpenChange, gameHistory, currentInventory, currentDay = 0 }: ChartDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Game Performance Charts</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-8">
          {/* Pass the current inventory to the InventoryChart */}
          <InventoryChart data={gameHistory} currentInventory={currentInventory} />

          {/* Pass the current day to the CashflowChart */}
          <CashflowChart data={gameHistory} currentDay={currentDay} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
