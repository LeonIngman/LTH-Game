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
            INSERT INTO "GameSession" ("userId", "levelId", "gameState", "updatedAt")
            VALUES (${userId}, ${levelId}, ${JSON.stringify(gameState)}, NOW())
            ON CONFLICT ("userId", "levelId")
            DO UPDATE SET 
                "gameState" = EXCLUDED."gameState",
                "updatedAt" = EXCLUDED."updatedAt"
            RETURNING "userId", "levelId"
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
            SELECT "userId", "levelId", "gameState", "updatedAt" 
            FROM "GameSession"
            WHERE "userId" = ${userId} AND "levelId" = ${levelId}
            ORDER BY "updatedAt" DESC
            LIMIT 1
        `

        if (result.length === 0) {
            return { success: true, gameState: null }
        }

        const session = result[0]

        // Validate that the gameState is valid JSON and contains expected properties
        if (!session.gameState || typeof session.gameState !== 'object') {
            console.warn(`Invalid game state found for user ${userId}, level ${levelId}`)
            return { success: true, gameState: null }
        }

        // Basic validation of required GameState properties
        const gameState = session.gameState as GameState
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
            WHERE "userId" = ${userId} AND "levelId" = ${levelId}
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
            SELECT "userId", "levelId", "gameState", "updatedAt"
            FROM "GameSession"
            WHERE "userId" = ${userId}
            ORDER BY "updatedAt" DESC
        `

        const sessions = result.map(session => ({
            id: session.userId, // for compatibility with expected return type
            levelId: session.levelId,
            lastUpdated: session.updatedAt,
            day: session.gameState?.day || 0,
            cash: session.gameState?.cash || 0
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
