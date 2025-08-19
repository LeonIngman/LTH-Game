"use server"

import { sql } from "@/lib/db"
import type { GameState } from "@/types/game"

/**
 * Result type for game session operations
 */
export interface GameSessionResult {
    success: boolean
    error?: string
    sessionId?: number
    gameState?: GameState | null
}

/**
 * Save or update a game session with idempotent upsert
 * Uses (user_id, level_id) as the unique key
 */
export async function saveGameSession(
    userId: string,
    levelId: number,
    gameState: GameState
): Promise<GameSessionResult> {
    try {
        if (!userId || userId.trim() === '') {
            return { success: false, error: "User ID is required" }
        }

        if (typeof levelId !== 'number' || levelId < 0) {
            return { success: false, error: "Valid level ID is required" }
        }

        if (!gameState) {
            return { success: false, error: "Game state is required" }
        }

        // Use PostgreSQL UPSERT with ON CONFLICT to ensure idempotent operation
        const result = await sql`
      INSERT INTO "GameSession" (user_id, level_id, game_state, created_at, updated_at)
      VALUES (${userId}, ${levelId}, ${JSON.stringify(gameState)}, NOW(), NOW())
      ON CONFLICT (user_id, level_id)
      DO UPDATE SET 
        game_state = ${JSON.stringify(gameState)},
        updated_at = NOW()
      RETURNING id
    `

        if (result.length === 0) {
            return { success: false, error: "Failed to save game session" }
        }

        return { success: true, sessionId: result[0].id }
    } catch (error) {
        console.error("Error saving game session:", error)
        return {
            success: false,
            error: `Failed to save game session: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
}

/**
 * Load a game session for a specific user and level
 * Returns null if no session exists
 */
export async function loadGameSession(
    userId: string,
    levelId: number
): Promise<GameSessionResult> {
    try {
        if (!userId || userId.trim() === '') {
            return { success: true, gameState: null }
        }

        if (typeof levelId !== 'number' || levelId < 0) {
            return { success: true, gameState: null }
        }

        const result = await sql`
      SELECT id, game_state, created_at, updated_at 
      FROM "GameSession"
      WHERE user_id = ${userId} AND level_id = ${levelId}
      ORDER BY updated_at DESC
      LIMIT 1
    `

        if (result.length === 0) {
            return { success: true, gameState: null }
        }

        const session = result[0]

        // Validate that the game_state is valid JSON and contains expected properties
        if (!session.game_state || typeof session.game_state !== 'object') {
            console.warn(`Invalid game state found for user ${userId}, level ${levelId}`)
            return { success: true, gameState: null }
        }

        // Basic validation of required GameState properties
        const gameState = session.game_state as GameState
        if (typeof gameState.day !== 'number' ||
            typeof gameState.cash !== 'number' ||
            !gameState.inventory ||
            typeof gameState.inventory !== 'object') {
            console.warn(`Corrupted game state found for user ${userId}, level ${levelId}`)
            return { success: true, gameState: null }
        }

        return {
            success: true,
            gameState,
            sessionId: session.id
        }
    } catch (error) {
        console.error("Error loading game session:", error)
        return {
            success: false,
            error: `Failed to load game session: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
}

/**
 * Delete a game session (e.g., when starting a new game or resetting)
 */
export async function deleteGameSession(
    userId: string,
    levelId: number
): Promise<GameSessionResult> {
    try {
        if (!userId || userId.trim() === '') {
            return { success: false, error: "User ID is required" }
        }

        if (typeof levelId !== 'number' || levelId < 0) {
            return { success: false, error: "Valid level ID is required" }
        }

        await sql`
      DELETE FROM "GameSession"
      WHERE user_id = ${userId} AND level_id = ${levelId}
    `

        return { success: true }
    } catch (error) {
        console.error("Error deleting game session:", error)
        return {
            success: false,
            error: `Failed to delete game session: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
}

/**
 * Get all active game sessions for a user (for admin/teacher views)
 */
export async function getUserGameSessions(userId: string): Promise<{
    success: boolean
    error?: string
    sessions?: Array<{
        id: number
        levelId: number
        lastUpdated: Date
        day: number
        cash: number
    }>
}> {
    try {
        if (!userId || userId.trim() === '') {
            return { success: false, error: "User ID is required" }
        }

        const result = await sql`
      SELECT id, level_id, game_state, updated_at
      FROM "GameSession"
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `

        const sessions = result.map(session => ({
            id: session.id,
            levelId: session.level_id,
            lastUpdated: session.updated_at,
            day: session.game_state?.day || 0,
            cash: session.game_state?.cash || 0
        }))

        return { success: true, sessions }
    } catch (error) {
        console.error("Error getting user game sessions:", error)
        return {
            success: false,
            error: `Failed to get user game sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
}
