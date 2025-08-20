"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import type { GameAction } from "@/types/game"
import { useAuth } from "@/lib/auth-context"
import type { GameActionsHook, GameActionsParams } from "../types/hooks"

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
  calculateTotalCost, // Add this parameter for pre-check
}: GameActionsParams): GameActionsHook {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [gameEnded, setGameEnded] = useState<boolean>(false)
  const [insufficientFundsMessage, setInsufficientFundsMessage] = useState<string | null>(null)
  const [lastInsufficientFundsMessage, setLastInsufficientFundsMessage] = useState<string | null>(null)

  // Pre-check for insufficient funds before API call
  const checkSufficientFunds = useCallback((): { sufficient: boolean; message?: string } => {
    const totalCost = calculateTotalCost()
    const availableCash = gameState.cash

    if (totalCost > availableCash) {
      const shortfall = (totalCost - availableCash).toFixed(2)
      return {
        sufficient: false,
        message: `Insufficient funds. Total cost ${totalCost.toFixed(2)} kr, available ${availableCash.toFixed(2)} kr. You need ${shortfall} kr more.`
      }
    }

    return { sufficient: true }
  }, [calculateTotalCost, gameState.cash])

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

      // Pre-check for sufficient funds before making API call
      const fundsCheck = checkSufficientFunds()
      if (!fundsCheck.sufficient) {
        const message = fundsCheck.message || 'Insufficient funds to complete this action'

        // Prevent spam by checking if message is different from last one
        if (message !== lastInsufficientFundsMessage) {
          setInsufficientFundsMessage(message)
          setLastInsufficientFundsMessage(message)

          // Show a non-blocking toast
          toast({
            title: "Insufficient Funds",
            description: message,
            variant: "destructive",
            duration: 5000,
          })
        }

        return false // Don't make API call, just return false
      }

      setIsLoading(true)
      setErrorMessage(null)
      setInsufficientFundsMessage(null) // Clear any previous insufficient funds message

      try {
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
          let errorData: any = {}

          // Safely parse JSON response
          try {
            errorData = await response.json()
          } catch (parseError) {
            console.warn("Failed to parse error response as JSON:", parseError)
            // Fallback for non-JSON responses
            errorData = { error: `Server error: ${response.status}` }
          }

          // Handle insufficient funds specifically
          if (response.status === 400 && errorData.code === 'INSUFFICIENT_FUNDS') {
            const message = errorData.message || 'Insufficient funds to complete this action'

            // Prevent spam by checking if message is different from last one
            if (message !== lastInsufficientFundsMessage) {
              setInsufficientFundsMessage(message)
              setLastInsufficientFundsMessage(message)

              // Also show a non-blocking toast
              toast({
                title: "Insufficient Funds",
                description: message,
                variant: "destructive",
                duration: 5000,
              })
            }

            return false // Don't throw, just return false to indicate failure
          }

          // For other errors, throw as before
          throw new Error(errorData.error || `Server error: ${response.status}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || "Failed to process day")
        }

        // Update game state
        setGameState(data.gameState)

        // Reset actions
        resetGameActions()

        // Clear insufficient funds message on successful processing
        setInsufficientFundsMessage(null)
        setLastInsufficientFundsMessage(null)

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
    [user, levelId, gameState, setGameState, resetGameActions, toast, handleApiError, lastInsufficientFundsMessage, checkSufficientFunds],
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
    insufficientFundsMessage,
    clearInsufficientFundsMessage: () => setInsufficientFundsMessage(null),
    checkSufficientFunds,
  }
}
