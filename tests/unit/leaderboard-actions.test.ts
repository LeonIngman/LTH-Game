// Mock the database before importing
const mockSql = jest.fn()
jest.mock('@/lib/db', () => ({
    sql: mockSql
}))

import { getLeaderboard, getLeaderboardByLevel } from '@/lib/actions/leaderboard-actions'

describe('Leaderboard Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('getLeaderboard', () => {
        it('should return multiple rows for the same student across different levels including GameSession data', async () => {
            // Mock database response with student having Performance in level 0 and GameSession in level 1
            const mockDbResponse = [
                {
                    id: 'user1',
                    username: 'leoningman-student2',
                    progress: 4,
                    profit: '-5147', // -51.47 kr in öre (from Performance record)
                    level: 0,
                    lastActive: '2025-08-15T10:00:00Z',
                    day: 4,
                    levelCompletedDate: null,
                    source: 'performance'
                },
                {
                    id: 'user1',
                    username: 'leoningman-student2',
                    progress: 4,
                    profit: '-39200', // -392 kr in öre (from GameSession record)
                    level: 1,
                    lastActive: '2025-08-15T12:00:00Z',
                    day: 5, // from game_session_day
                    levelCompletedDate: null,
                    source: 'game_session'
                },
                {
                    id: 'user2',
                    username: 'leoningman-student',
                    progress: 13,
                    profit: '20000', // 200.00 kr in öre
                    level: 0,
                    lastActive: '2025-08-13T15:00:00Z',
                    day: 13,
                    levelCompletedDate: null,
                    source: 'performance'
                }
            ]

            mockSql.mockResolvedValueOnce(mockDbResponse)

            const result = await getLeaderboard()

            // Should return 3 rows total: 2 for leoningman-student2 (level 0 from Performance, level 1 from GameSession) + 1 for leoningman-student (level 0)
            expect(result).toHaveLength(3)

            // Check leoningman-student2 has entries for both levels
            const student2Entries = result.filter(r => r.username === 'leoningman-student2')
            expect(student2Entries).toHaveLength(2)

            // Verify level 0 entry (from Performance)
            const level0Entry = student2Entries.find(e => e.level === 0)
            expect(level0Entry).toBeDefined()
            expect(level0Entry?.profit).toBe(-5147)
            expect(level0Entry?.day).toBe(4)
            expect(level0Entry?.id).toBe('user1-0')

            // Verify level 1 entry (from GameSession)
            const level1Entry = student2Entries.find(e => e.level === 1)
            expect(level1Entry).toBeDefined()
            expect(level1Entry?.profit).toBe(-39200)
            expect(level1Entry?.day).toBe(5)
            expect(level1Entry?.id).toBe('user1-1')

            // Check leoningman-student has one entry
            const student1Entries = result.filter(r => r.username === 'leoningman-student')
            expect(student1Entries).toHaveLength(1)
            expect(student1Entries[0].level).toBe(0)
            expect(student1Entries[0].profit).toBe(20000)
        })

        it('should generate unique IDs for each user-level combination', async () => {
            const mockDbResponse = [
                {
                    id: 'user1',
                    username: 'student1',
                    progress: 1,
                    profit: '1000',
                    level: 0,
                    lastActive: '2025-08-15T10:00:00Z',
                    day: 1,
                    levelCompletedDate: null
                },
                {
                    id: 'user1',
                    username: 'student1',
                    progress: 2,
                    profit: '2000',
                    level: 1,
                    lastActive: '2025-08-15T11:00:00Z',
                    day: 2,
                    levelCompletedDate: null
                }
            ]

            mockSql.mockResolvedValueOnce(mockDbResponse)

            const result = await getLeaderboard()

            expect(result).toHaveLength(2)
            expect(result[0].id).toBe('user1-0')
            expect(result[1].id).toBe('user1-1')

            // IDs should be unique
            const ids = result.map(r => r.id)
            expect(new Set(ids).size).toBe(ids.length)
        })

        it('should handle string and numeric profit values correctly', async () => {
            const mockDbResponse = [
                {
                    id: 'user1',
                    username: 'student1',
                    progress: 1,
                    profit: '1500', // String profit
                    level: 0,
                    lastActive: '2025-08-15T10:00:00Z',
                    day: 1,
                    levelCompletedDate: null
                },
                {
                    id: 'user2',
                    username: 'student2',
                    progress: 1,
                    profit: 2500, // Numeric profit
                    level: 0,
                    lastActive: '2025-08-15T10:00:00Z',
                    day: 1,
                    levelCompletedDate: null
                }
            ]

            mockSql.mockResolvedValueOnce(mockDbResponse)

            const result = await getLeaderboard()

            expect(result[0].profit).toBe(1500)
            expect(result[1].profit).toBe(2500)
            expect(typeof result[0].profit).toBe('number')
            expect(typeof result[1].profit).toBe('number')
        })

        it('should fall back to mock data when database query fails', async () => {
            mockSql.mockRejectedValueOnce(new Error('Database connection failed'))

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { })

            const result = await getLeaderboard()

            expect(consoleSpy).toHaveBeenCalledWith('Error getting leaderboard:', expect.any(Error))
            expect(consoleLogSpy).toHaveBeenCalledWith('Falling back to mock leaderboard data due to database error')

            // Should return mock data
            expect(result).toHaveLength(6) // Mock data has 6 entries
            expect(result.every(r => r.id.includes('-'))).toBe(true) // All IDs should have user-level format

            consoleSpy.mockRestore()
            consoleLogSpy.mockRestore()
        })
    })

    describe('getLeaderboardByLevel', () => {
        it('should return only entries for the specified level', async () => {
            const mockDbResponse = [
                {
                    id: 'user1',
                    username: 'student1',
                    progress: 2,
                    profit: '2000',
                    level: 1,
                    lastActive: '2025-08-15T10:00:00Z',
                    day: 2,
                    levelCompletedDate: null
                },
                {
                    id: 'user2',
                    username: 'student2',
                    progress: 3,
                    profit: '3000',
                    level: 1,
                    lastActive: '2025-08-15T11:00:00Z',
                    day: 3,
                    levelCompletedDate: null
                }
            ]

            mockSql.mockResolvedValueOnce(mockDbResponse)

            const result = await getLeaderboardByLevel(1)

            expect(result).toHaveLength(2)
            expect(result.every(r => r.level === 1)).toBe(true)
            expect(result[0].id).toBe('user1-1')
            expect(result[1].id).toBe('user2-1')
        })
    })
})