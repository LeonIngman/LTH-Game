import { sql } from '@/lib/db'

/**
 * Troubleshooting test to diagnose leaderboard data issues
 * This test connects to the actual database to verify data state
 * 
 * NOTE: This test contains extensive console logging for debugging purposes.
 * It should only be run when troubleshooting specific database issues.
 */
describe.skip('Leaderboard Database Troubleshooting', () => {
  it('should show all Performance records in the database', async () => {
    try {
      const performances = await sql`
        SELECT 
          p.*,
          u.username
        FROM "Performance" p
        JOIN "User" u ON p."userId" = u.id
        ORDER BY u.username, p."levelId", p."createdAt" DESC
      `

      expect(performances.length).toBeGreaterThan(0)
    } catch (error) {
      console.error('Database query failed:', error)
      throw error
    }
  })

  it('should show the CTE query results step by step', async () => {
    try {
      await sql`
        SELECT DISTINCT ON (p."userId", p."levelId")
          p."userId" as user_id,
          p."levelId" as level_id,
          p."cumulativeProfit" as cumulative_profit,
          p."createdAt" as created_at,
          u.username
        FROM "Performance" p
        JOIN "User" u ON p."userId" = u.id
        WHERE u.role = 'student'
        ORDER BY p."userId", p."levelId", p."createdAt" DESC
      `

      await sql`
        WITH latest_performance_per_level AS (
          SELECT DISTINCT ON (p."userId", p."levelId")
            p."userId" as user_id,
            p."levelId" as level_id,
            p."cumulativeProfit" as cumulative_profit,
            p."createdAt" as created_at
          FROM "Performance" p
          ORDER BY p."userId", p."levelId", p."createdAt" DESC
        )
        SELECT DISTINCT
          u.id,
          u.username,
          u.progress,
          u."lastActive",
          lp.level_id,
          lp.cumulative_profit
        FROM "User" u
        INNER JOIN latest_performance_per_level lp ON lp.user_id = u.id
        WHERE u.role = 'student'
        ORDER BY u.username, lp.level_id
      `

      const finalResult = await sql`
        WITH latest_performance_per_level AS (
          SELECT DISTINCT ON (p."userId", p."levelId")
            p."userId" as user_id,
            p."levelId" as level_id,
            p."cumulativeProfit" as cumulative_profit,
            p."createdAt" as created_at
          FROM "Performance" p
          ORDER BY p."userId", p."levelId", p."createdAt" DESC
        ),
        user_levels AS (
          SELECT DISTINCT
            u.id,
            u.username,
            u.progress,
            u."lastActive",
            lp.level_id,
            lp.cumulative_profit
          FROM "User" u
          INNER JOIN latest_performance_per_level lp ON lp.user_id = u.id
          WHERE u.role = 'student'
        )
        SELECT 
          ul.id,
          ul.username,
          ul.progress,
          COALESCE(ul.cumulative_profit, 0) AS profit,
          COALESCE(ul.level_id, 0) AS level,
          ul."lastActive",
          COALESCE(ul.progress, 0) AS day,
          NULL AS "levelCompletedDate"
        FROM user_levels ul
        ORDER BY ul.level_id ASC, ul.cumulative_profit DESC, ul."lastActive" DESC
      `

      expect(finalResult.length).toBeGreaterThan(0)
    } catch (error) {
      console.error('Database troubleshooting failed:', error)
      throw error
    }
  })

  it('should verify user data exists', async () => {
    try {
      const users = await sql`
        SELECT id, username, role, progress, "lastActive" 
        FROM "User" 
        WHERE role = 'student'
        ORDER BY username
      `

      expect(users.length).toBeGreaterThan(0)
    } catch (error) {
      console.error('User query failed:', error)
      throw error
    }
  })
})
