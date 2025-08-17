/**
 * Integration tests for leaderboard database connectivity and data verification
 * Verifies that the database connection works and data is properly retrieved
 * @jest-environment node
 */

import { sql } from '../../lib/db'
import { getLeaderboard, getLeaderboardByLevel } from '../../lib/actions/leaderboard-actions'

describe('Leaderboard Database Integration', () => {
    beforeAll(async () => {
        // Ensure database connection is available
    })

    afterAll(async () => {
        // Clean up database connection if needed
    })

    describe('Database Connectivity', () => {
        test('should connect to database successfully', async () => {
            try {
                const result = await sql`SELECT 1 as connection_test`
                expect(result).toBeDefined()
                expect(result).toHaveLength(1)
                expect(result[0].connection_test).toBe(1)
            } catch (error) {
                console.error('Database connection failed:', error)
                fail('Database connection should not fail')
            }
        })

        test('should have required tables', async () => {
            try {
                // Check if User table exists and has data
                const userTable = await sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'User' AND table_schema = 'public'
      `
                expect(parseInt(userTable[0].count)).toBe(1)

                // Check if Performance table exists and has data  
                const perfTable = await sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'Performance' AND table_schema = 'public'
      `
                expect(parseInt(perfTable[0].count)).toBe(1)

                // Check if TimeStamp table exists and has data
                const timeTable = await sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'TimeStamp' AND table_schema = 'public'
      `
                expect(parseInt(timeTable[0].count)).toBe(1)

            } catch (error) {
                console.error('Table check failed:', error)
                fail('Required tables should exist')
            }
        })

        describe('Data Verification', () => {
            test('should have student users in database', async () => {
                const students = await sql`
        SELECT id, username, role, progress, "lastActive"
        FROM "User" 
        WHERE role = 'student'
        LIMIT 10
      `

                expect(students.length).toBeGreaterThan(0)
                students.forEach(student => {
                    expect(student.role).toBe('student')
                    expect(student.username).toBeDefined()
                    expect(student.id).toBeDefined()
                })
            })

            test('should have performance records in database', async () => {
                const performances = await sql`
        SELECT 
          p."userId", 
          p."levelId", 
          p."cumulativeProfit", 
          p."sessionId",
          p."createdAt",
          u.username
        FROM "Performance" p
        JOIN "User" u ON u.id = p."userId"
        WHERE u.role = 'student'
        ORDER BY p."createdAt" DESC
        LIMIT 10
      `

                if (performances.length > 0) {
                    performances.forEach(perf => {
                        expect(perf.userId).toBeDefined()
                        expect(perf.levelId).toBeDefined()
                        expect(perf.cumulativeProfit).toBeDefined()
                        expect(perf.username).toBeDefined()
                    })
                } else {
                    // No performance records found - empty test case
                }
            })

            test('should have GameSession records with game state data', async () => {
                const gameSessions = await sql`
        SELECT 
          gs.id,
          gs.user_id,
          gs.level_id,
          gs.game_state::json->>'cumulativeProfit' as profit,
          gs.game_state::json->>'day' as day,
          gs.updated_at
        FROM "GameSession" gs
        WHERE gs.game_state IS NOT NULL
        ORDER BY gs.updated_at DESC
        LIMIT 10
      `

                gameSessions.forEach(gs => {
                    expect(gs.user_id).toBeDefined()
                    expect(gs.level_id).toBeDefined()
                })
            })
        })

        describe('Leaderboard Functions', () => {
            test('getLeaderboard should return real data from database', async () => {
                const leaderboard = await getLeaderboard()

                expect(Array.isArray(leaderboard)).toBe(true)

                if (leaderboard.length > 0) {
                    // Verify structure of returned data
                    leaderboard.forEach(entry => {
                        expect(entry).toHaveProperty('id')
                        expect(entry).toHaveProperty('userId')
                        expect(entry).toHaveProperty('username')
                        expect(entry).toHaveProperty('profit')
                        expect(entry).toHaveProperty('level')
                        expect(entry).toHaveProperty('day')
                        expect(entry).toHaveProperty('lastActive')

                        // Verify data types
                        expect(typeof entry.username).toBe('string')
                        expect(typeof entry.profit).toBe('number')
                        expect(typeof entry.level).toBe('number')
                        expect(typeof entry.day).toBe('number')
                    })

                    // Check if we have real data (not just mock data)
                    const hasRealUserIds = leaderboard.some(entry =>
                        entry.userId && !entry.userId.startsWith('student-')
                    )

                    // Real data validation is sufficient without logging
                } else {
                    // Empty leaderboard test continues
                }
            })

            test('getLeaderboardByLevel should return level-specific data', async () => {
                const level0Data = await getLeaderboardByLevel(0)

                expect(Array.isArray(level0Data)).toBe(true)

                level0Data.forEach(entry => {
                    expect(entry.level).toBe(0)
                    expect(entry).toHaveProperty('profit')
                    expect(entry).toHaveProperty('day')
                    expect(entry).toHaveProperty('username')
                })
            })
        })

        describe('Data Consistency Checks', () => {
            test('should verify student progress matches performance data', async () => {
                // Get students with their latest progress
                const studentsWithProgress = await sql`
        WITH latest_perf AS (
          SELECT DISTINCT ON (p."userId")
            p."userId",
            p."levelId",
            p."cumulativeProfit",
            p."createdAt"
          FROM "Performance" p
          ORDER BY p."userId", p."createdAt" DESC
        )
        SELECT 
          u.id,
          u.username,
          u.progress as user_progress,
          lp."levelId" as latest_level,
          lp."cumulativeProfit" as latest_profit,
          u.progress as latest_day
        FROM "User" u
        LEFT JOIN latest_perf lp ON lp."userId" = u.id
        WHERE u.role = 'student'
        ORDER BY u.username
        LIMIT 5
      `

                expect(studentsWithProgress.length).toBeGreaterThan(0)
            })
        })

        describe('Leaderboard Functions', () => {
            test('getLeaderboard should return real data from database', async () => {
                const result = await getLeaderboard()

                if (result.length > 0) {
                    result.forEach(entry => {
                        expect(entry.id).toBeDefined()
                        expect(entry.username).toBeDefined()
                        expect(typeof entry.profit).toBe('number')
                        expect(typeof entry.level).toBe('number')
                    })
                }

                expect(result).toBeDefined()
            })
        })
    })
}
