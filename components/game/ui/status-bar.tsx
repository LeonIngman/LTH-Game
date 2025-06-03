"use client"

import type { GameState, LevelConfig } from "@/types/game"
import type { StatusBarProps } from "@/types/components"

export function StatusBar({ gameState, levelConfig }: StatusBarProps) {
  // Add safety checks for all gameState properties
  const currentGameDay = gameState?.day || 0
  const cash = typeof gameState?.cash === "number" ? gameState.cash : 0
  const profit = typeof gameState?.cumulativeProfit === "number" ? gameState.cumulativeProfit : 0
  const score = typeof gameState?.score === "number" ? gameState.score : 0

  // Add safety check for levelConfig
  const daysToComplete = levelConfig?.daysToComplete || 30

  return (
    <div className="bg-gray-50 p-4 rounded-lg border game-status-bar" data-tutorial="status-bar">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Day</p>
          <p className="text-xl font-bold">
            {currentGameDay} <span className="text-sm text-muted-foreground">/ {daysToComplete}</span>
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Cash</p>
          <p className="text-xl font-bold">{cash.toFixed(2)} kr</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Profit</p>
          <p className={`text-xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {profit.toFixed(2)} kr
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Score</p>
          <p className="text-xl font-bold">{score}</p>
        </div>
      </div>
    </div>
  )
}
