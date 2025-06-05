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

      // Initialize the game state
      const initialState = initializeGameState(levelConfig)

      //   customerDeliveries?: Record<number, { quantity: number; revenue: number }>
      //   latenessPenalties?: LatenessPenalty[]
      // }

      // Add day 0 to the game history with initial inventory values
      if (!initialState.history || initialState.history.length === 0) {
        initialState.history = [
          {
            day: 0,
            cash: levelConfig.initialCash,
            inventory: { ...levelConfig.initialInventory },
            inventoryValue: {
              patty: 0,
              bun: 0,
              cheese: 0,
              potato: 0,
              finishedGoods: 0,
            },
            holdingCosts: {
              patty: 0,
              bun: 0,
              cheese: 0,
              potato: 0,
              finishedGoods: 0,
            },
            overstockCosts: {
              patty: 0,
              bun: 0,
              cheese: 0,
              potato: 0,
              finishedGoods: 0,
            },
            pattyPurchased: 0,
            cheesePurchased: 0,
            bunPurchased: 0,
            potatoPurchased: 0,
            production: 0,
            sales: 0,
            revenue: 0,
            costs: {
              purchases: 0,
              production: 0,
              holding: 0,
              total: 0,
            },
            profit: 0,
            cumulativeProfit: 0,
            score: 0,
            customerDeliveries: [],
            latenessPenalties: [],
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
      if (!initialState.history || initialState.history.length === 0) {
        initialState.history = [
          {
            day: 0,
            cash: levelConfig.initialCash,
            inventory: { ...levelConfig.initialInventory },
            inventoryValue: {
              patty: 0,
              bun: 0,
              cheese: 0,
              potato: 0,
              finishedGoods: 0,
            },
            holdingCosts: {
              patty: 0,
              bun: 0,
              cheese: 0,
              potato: 0,
              finishedGoods: 0,
            },
            overstockCosts: {
              patty: 0,
              bun: 0,
              cheese: 0,
              potato: 0,
              finishedGoods: 0,
            },
            pattyPurchased: 0,
            cheesePurchased: 0,
            bunPurchased: 0,
            potatoPurchased: 0,
            production: 0,
            sales: 0,
            revenue: 0,
            costs: {
              purchases: 0,
              production: 0,
              holding: 0,
              total: 0,
            },
            profit: 0,
            cumulativeProfit: 0,
            score: 0,
            customerDeliveries: [],
            latenessPenalties: [],
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
