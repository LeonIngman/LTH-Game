"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import type { GameState, LevelConfig } from "@/types/game"
import { initializeGameState } from "@/lib/game/engine"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import type { GameStateHook } from "../types/hooks"

/**
 * Enhanced game state hook with manual database persistence
 * Loads saved state on mount and provides manual save functionality with dirty state tracking
 */
export function usePersistedGameState(levelConfig: LevelConfig): GameStateHook & {
    isLoadingState: boolean
    isSaving: boolean
    lastSaved: Date | null
    isDirty: boolean
    saveGameState: () => Promise<void>
    resetLevelState: () => Promise<void>
} {
    const { user } = useAuth()
    const { toast } = useToast()

    const [gameState, setGameStateInternal] = useState<GameState>(() => initializeGameState(levelConfig))
    const [isLoadingState, setIsLoadingState] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [isDirty, setIsDirty] = useState(false)

    // Ref to track if we've loaded initial state
    const hasLoadedInitialState = useRef(false)

    // Load game state from database on mount
    useEffect(() => {
        if (!user) return

        const loadSavedState = async () => {
            setIsLoadingState(true)
            try {
                const response = await fetch(`/api/game/load-game-state?userId=${user.id}&levelId=${levelConfig.id}`)
                const data = await response.json()

                if (!response.ok) {
                    console.warn("Failed to load saved game state:", data.error)
                    return
                }

                if (data.success && data.hasSession && data.gameState) {
                    setGameStateInternal(data.gameState)
                    setLastSaved(new Date())
                    setIsDirty(false)
                    hasLoadedInitialState.current = true

                    // Show user that their progress was restored
                    toast({
                        title: "Progress Restored",
                        description: `Resumed from Day ${data.gameState.day}`,
                        duration: 3000,
                    })
                } else {
                    // No saved game state found, using initial state
                    hasLoadedInitialState.current = true
                }
            } catch (error) {
                console.error("Error loading game state:", error)
                toast({
                    title: "Unable to Load Progress",
                    description: "Starting with a fresh game state",
                    variant: "destructive",
                    duration: 3000,
                })
                hasLoadedInitialState.current = true
            } finally {
                setIsLoadingState(false)
            }
        }

        loadSavedState()
    }, [user, levelConfig.id, toast])

    // Save game state to database
    const saveGameState = useCallback(async (): Promise<void> => {
        if (!user || isSaving) return

        setIsSaving(true)
        try {
            const response = await fetch('/api/game/save-game-state', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    levelId: levelConfig.id,
                    gameState,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save game state')
            }

            if (data.success) {
                setLastSaved(new Date())
                setIsDirty(false)

                toast({
                    title: "Progress Saved",
                    description: "Your game progress has been saved successfully.",
                    duration: 2000,
                })
            } else {
                throw new Error(data.error || 'Save operation failed')
            }
        } catch (error) {
            console.error("Error saving game state:", error)
            toast({
                title: "Save Failed",
                description: "Your progress could not be saved. Please try again.",
                variant: "destructive",
            })
            throw error
        } finally {
            setIsSaving(false)
        }
    }, [user, levelConfig.id, gameState, isSaving, toast])    // Enhanced setGameState that tracks dirty state
    const setGameState = useCallback((newState: GameState) => {
        setGameStateInternal(newState)

        // Only mark as dirty if we've loaded the initial state and user is authenticated
        if (hasLoadedInitialState.current && user) {
            setIsDirty(true)
        }
    }, [user])

    // Derived state
    const isGameOver = gameState.gameOver || gameState.day >= levelConfig.daysToComplete
    const isLastDay = gameState.day === levelConfig.daysToComplete - 1

    // Reset game state (and clear saved state)
    const resetGameState = useCallback(async (): Promise<void> => {
        try {
            const initialState = initializeGameState(levelConfig)
            setGameStateInternal(initialState)
            setIsDirty(false)
            setLastSaved(null)

            // Clear saved state from database
            if (user) {
                await fetch('/api/game/delete-game-state', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: user.id,
                        levelId: levelConfig.id,
                    }),
                })
            }

            // Reset successful - no logging needed
        } catch (error) {
            console.error("Error resetting game state:", error)
            // Still reset the local state even if database clear fails
            const initialState = initializeGameState(levelConfig)
            setGameStateInternal(initialState)
            setIsDirty(false)
            setLastSaved(null)
        }
    }, [levelConfig, user])

    // Reset level state (using dedicated API endpoint with telemetry)
    const resetLevelState = useCallback(async (): Promise<void> => {
        if (!user) {
            throw new Error("User must be authenticated to reset level")
        }

        try {
            const response = await fetch('/api/game/reset-level', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    levelId: levelConfig.id,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset level')
            }

            if (data.success) {
                // Reset local state to initial state
                const initialState = initializeGameState(levelConfig)
                setGameStateInternal(initialState)
                setIsDirty(false)
                setLastSaved(null)
                hasLoadedInitialState.current = true

                toast({
                    title: "Level Reset Successfully",
                    description: `Level ${levelConfig.id} has been reset to its initial state.`,
                    duration: 3000,
                })

                // Reset successful - no additional logging needed
            } else {
                throw new Error(data.error || 'Reset operation failed')
            }
        } catch (error) {
            console.error("Error resetting level:", error)
            toast({
                title: "Reset Failed",
                description: error instanceof Error ? error.message : "Unable to reset level. Please try again.",
                variant: "destructive",
                duration: 5000,
            })
            throw error
        }
    }, [levelConfig, user, toast])

    return {
        gameState,
        setGameState,
        isGameOver,
        isLastDay,
        resetGameState,
        isLoadingState,
        isSaving,
        lastSaved,
        isDirty,
        saveGameState,
        resetLevelState,
    }
}
