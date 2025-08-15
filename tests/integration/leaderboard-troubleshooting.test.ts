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

            console.log('=== ALL PERFORMANCE RECORDS ===')
            console.log(`Found ${performances.length} performance records`)

            performances.forEach((p, index) => {
                console.log(`${index + 1}. User: ${p.username} | Level: ${p.levelId} | Profit: ${p.cumulativeProfit} | Timestamp: ${p.timestampId} | Created: ${p.createdAt}`)
            })

            // Check specifically for leoningman-student2
            const student2Records = performances.filter(p => p.username === 'leoningman-student2')
            console.log(`\n=== LEONINGMAN-STUDENT2 RECORDS (${student2Records.length}) ===`)
            student2Records.forEach((p, index) => {
                console.log(`${index + 1}. Level: ${p.levelId} | Profit: ${p.cumulativeProfit} | Day: ${p.timestampId} | Created: ${p.createdAt}`)
            })

            expect(performances.length).toBeGreaterThan(0)
        } catch (error) {
            console.error('Database query failed:', error)
            throw error
        }
    })

    it('should show the CTE query results step by step', async () => {
        try {
            console.log('\n=== STEP 1: Latest Performance Per Level ===')
            const latestPerf = await sql`
        SELECT DISTINCT ON (p."userId", p."levelId")
          p."userId" as user_id,
          p."levelId" as level_id,
          p."cumulativeProfit" as cumulative_profit,
          p."timestampId" as timestamp_id,
          p."createdAt" as created_at,
          u.username
        FROM "Performance" p
        JOIN "User" u ON p."userId" = u.id
        WHERE u.role = 'student'
        ORDER BY p."userId", p."levelId", p."createdAt" DESC
      `

            console.log(`Found ${latestPerf.length} latest performance records per user-level`)
            latestPerf.forEach((p, index) => {
                console.log(`${index + 1}. User: ${p.username} | Level: ${p.level_id} | Profit: ${p.cumulative_profit} | Timestamp: ${p.timestamp_id}`)
            })

            console.log('\n=== STEP 2: User-Level Combinations ===')
            const userLevels = await sql`
        WITH latest_performance_per_level AS (
          SELECT DISTINCT ON (p."userId", p."levelId")
            p."userId" as user_id,
            p."levelId" as level_id,
            p."cumulativeProfit" as cumulative_profit,
            p."timestampId" as timestamp_id,
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
          lp.cumulative_profit,
          lp.timestamp_id
        FROM "User" u
        INNER JOIN latest_performance_per_level lp ON lp.user_id = u.id
        WHERE u.role = 'student'
        ORDER BY u.username, lp.level_id
      `

            console.log(`Found ${userLevels.length} user-level combinations`)
            userLevels.forEach((ul, index) => {
                console.log(`${index + 1}. User: ${ul.username} | Level: ${ul.level_id} | Profit: ${ul.cumulative_profit} | Progress: ${ul.progress}`)
            })

            console.log('\n=== STEP 3: Final Query Result ===')
            const finalResult = await sql`
        WITH latest_performance_per_level AS (
          SELECT DISTINCT ON (p."userId", p."levelId")
            p."userId" as user_id,
            p."levelId" as level_id,
            p."cumulativeProfit" as cumulative_profit,
            p."timestampId" as timestamp_id,
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
            lp.cumulative_profit,
            lp.timestamp_id
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
          COALESCE(ts."timestampNumber", 0) AS day,
          NULL AS "levelCompletedDate"
        FROM user_levels ul
            LEFT JOIN "TimeStamp" ts ON ts.id = ul.timestamp_id
        ORDER BY ul.level_id ASC, ul.cumulative_profit DESC, ul."lastActive" DESC
      `

            console.log(`Final result has ${finalResult.length} rows`)
            finalResult.forEach((r, index) => {
                console.log(`${index + 1}. User: ${r.username} | Level: ${r.level} | Day: ${r.day} | Profit: ${r.profit} | Last Active: ${r.lastActive}`)
            })

            // Verify leoningman-student2 appears multiple times
            const student2Final = finalResult.filter(r => r.username === 'leoningman-student2')
            console.log(`\n=== LEONINGMAN-STUDENT2 FINAL ENTRIES (${student2Final.length}) ===`)
            student2Final.forEach((r, index) => {
                console.log(`${index + 1}. Level: ${r.level} | Day: ${r.day} | Profit: ${r.profit}`)
            })

            expect(finalResult.length).toBeGreaterThan(0)
        } catch (error) {
            console.error('Database troubleshooting failed:', error)
            throw error
        }
    })

    it('should verify timestamp data exists', async () => {
        try {
            const timestamps = await sql`
        SELECT * FROM "TimeStamp" ORDER BY id
      `

            console.log('\n=== TIMESTAMP RECORDS ===')
            console.log(`Found ${timestamps.length} timestamp records`)
            timestamps.forEach((ts, index) => {
                console.log(`${index + 1}. ID: ${ts.id} | Number: ${ts.timestampNumber} | Level: ${ts.levelId}`)
            })

            expect(timestamps.length).toBeGreaterThan(0)
        } catch (error) {
            console.error('Timestamp query failed:', error)
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

            console.log('\n=== STUDENT USER RECORDS ===')
            console.log(`Found ${users.length} student users`)
            users.forEach((u, index) => {
                console.log(`${index + 1}. ID: ${u.id} | Username: ${u.username} | Progress: ${u.progress} | Last Active: ${u.lastActive}`)
            })

            expect(users.length).toBeGreaterThan(0)
        } catch (error) {
            console.error('User query failed:', error)
            throw error
        }
    })
})
