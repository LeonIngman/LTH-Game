"use client"

import { useState, useCallback } from "react"
import type { GameState, LevelConfig } from "@/types/game"
import { initializeGameState } from "@/lib/game/engine"
import type { GameStateHook } from "../types/hooks"

/**
 * Hook for managing game state
 */
export function useGameState(levelConfig: LevelConfig): GameStateHook {
  // Initialize game state with proper error handling
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      // Ensure levelConfig has a demandModel function
      if (!levelConfig.demandModel) {
        // Use default demand model instead of logging an error
        levelConfig.demandModel = (day) => ({ quantity: 10, pricePerUnit: 30 })
      }

      // Initialize the game state
      const initialState = initializeGameState(levelConfig)

      // Add day 0 to the game history with initial inventory values
      if (!initialState.gameHistory || initialState.gameHistory.length === 0) {
        initialState.gameHistory = [
          {
            day: 0,
            inventory: { ...levelConfig.initialInventory },
            cash: levelConfig.initialCash,
            totalCost: 0,
            revenue: 0,
            profit: 0,
            productionAmount: 0,
            customerOrders: [],
            supplierOrders: [],
            customerDeliveries: [],
            supplierDeliveries: [],
            holdingCosts: {
              patty: 0,
              bun: 0,
              cheese: 0,
              potato: 0,
              finishedGoods: 0,
            },
            productionCost: 0,
            totalHoldingCost: 0,
          },
        ]
      }

      return initialState
    } catch (err) {
      // Don't log errors in production
      throw err
    }
  })

  // Derived state
  const isGameOver = gameState.gameOver || gameState.day >= levelConfig.daysToComplete
  const isLastDay = gameState.day === levelConfig.daysToComplete - 1

  // Reset game state
  const resetGameState = useCallback((): void => {
    try {
      const initialState = initializeGameState(levelConfig)

      // Add day 0 to the game history with initial inventory values
      if (!initialState.gameHistory || initialState.gameHistory.length === 0) {
        initialState.gameHistory = [
          {
            day: 0,
            inventory: { ...levelConfig.initialInventory },
            cash: levelConfig.initialCash,
            totalCost: 0,
            revenue: 0,
            profit: 0,
            productionAmount: 0,
            customerOrders: [],
            supplierOrders: [],
            customerDeliveries: [],
            supplierDeliveries: [],
            holdingCosts: {
              patty: 0,
              bun: 0,
              cheese: 0,
              potato: 0,
              finishedGoods: 0,
            },
            productionCost: 0,
            totalHoldingCost: 0,
          },
        ]
      }

      setGameState(initialState)
    } catch (err) {
      // Don't log errors in production
      throw err
    }
  }, [levelConfig])

  return {
    gameState,
    setGameState,
    isGameOver,
    isLastDay,
    resetGameState,
  }
}
