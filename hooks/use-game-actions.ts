"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import type { GameAction } from "@/types/game"
import { useAuth } from "@/lib/auth-context"
import type { GameActionsHook, GameActionsParams } from "./types"

/**
 * Hook for managing game actions like processing a day and submitting level results
 */
export function useGameActions({
  levelId,
  gameState,
  setGameState,
  initializeSupplierOrders,
  initializeCustomerOrders,
  setSupplierOrders,
  setCustomerOrders,
  setAction,
  selectedDeliveryOption,
}: GameActionsParams): GameActionsHook {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [gameEnded, setGameEnded] = useState<boolean>(false)

  // Handle API errors
  const handleApiError = useCallback(
    (error: unknown, defaultMessage: string): string => {
      console.error(defaultMessage, error)
      const errorMsg = `Error: ${error instanceof Error ? error.message : defaultMessage}`

      toast({
        title: "Error",
        description: defaultMessage,
        variant: "destructive",
      })

      return errorMsg
    },
    [toast],
  )

  // Reset game actions
  const resetGameActions = useCallback(() => {
    try {
      const newSupplierOrders = initializeSupplierOrders()
      const newCustomerOrders = initializeCustomerOrders()

      setSupplierOrders(newSupplierOrders)
      setCustomerOrders(newCustomerOrders)
      setAction({
        supplierOrders: newSupplierOrders,
        production: 0,
        salesAttempt: 0,
        deliveryOptionId: selectedDeliveryOption,
        customerOrders: newCustomerOrders,
      })
    } catch (error) {
      console.error("Error resetting game actions:", error)
      handleApiError(error, "Failed to reset game actions")
    }
  }, [
    initializeSupplierOrders,
    initializeCustomerOrders,
    setSupplierOrders,
    setCustomerOrders,
    setAction,
    selectedDeliveryOption,
    handleApiError,
  ])

  // Process a day
  const processDay = useCallback(
    async (action: GameAction): Promise<boolean> => {
      if (!user) {
        toast({
          title: "Not logged in",
          description: "Please log in to play the game",
          variant: "destructive",
        })
        return false
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        console.log("Processing day with action:", JSON.stringify(action))
        console.log("Current game state:", JSON.stringify(gameState))

        const response = await fetch("/api/game/process-day", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            levelId,
            gameState,
            action,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Server error: ${response.status}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || "Failed to process day")
        }

        console.log("New game state:", JSON.stringify(data.gameState))

        // Update game state
        setGameState(data.gameState)

        // Reset actions
        resetGameActions()

        // Check if game is over
        if (data.gameOver) {
          setGameEnded(true)
          toast({
            title: "Game Over",
            description: `You've completed level ${levelId}!`,
          })
        }

        // Check if game is over due to bankruptcy
        if (data.gameState.gameOver) {
          toast({
            title: "Game Over",
            description: "You've run out of money and can't continue operations.",
            variant: "destructive",
          })
        }

        return true
      } catch (error) {
        setErrorMessage(handleApiError(error, "Failed to process day. Please try again."))
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [user, levelId, gameState, setGameState, resetGameActions, toast, handleApiError],
  )

  // Submit level results
  const submitLevel = useCallback(async (): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to submit results",
        variant: "destructive",
      })
      return false
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/game/submit-level", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          levelId,
          gameState,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to submit level")
      }

      toast({
        title: "Level Completed",
        description: `Your score: ${data.result.score}. Great job!`,
      })

      // Navigate to performance page
      router.push(`/dashboard/student/performance/${levelId}`)
      return true
    } catch (error) {
      setErrorMessage(handleApiError(error, "Failed to submit level results. Please try again."))
      return false
    } finally {
      setIsLoading(false)
    }
  }, [user, levelId, gameState, router, toast, handleApiError])

  return {
    isLoading,
    errorMessage,
    gameEnded,
    setGameEnded,
    processDay,
    submitLevel,
  }
}
