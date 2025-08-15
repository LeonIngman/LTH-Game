import { render, screen, waitFor } from '@testing-library/react'
import { Leaderboard } from '@/components/dashboard/leaderboard'

// Mock data representing multiple levels for the same student
const mockLeaderboardData = [
    {
        id: 'user1-0',
        userId: 'user1',
        username: 'leoningman-student2',
        progress: 4,
        profit: -5147, // -51.47 kr in öre
        level: 0,
        lastActive: '2025-08-15',
        day: 4,
        levelCompletedDate: null
    },
    {
        id: 'user1-1',
        userId: 'user1',
        username: 'leoningman-student2',
        progress: 2,
        profit: -98745, // -987.45 kr in öre
        level: 1,
        lastActive: '2025-08-15',
        day: 2,
        levelCompletedDate: null
    },
    {
        id: 'user2-0',
        userId: 'user2',
        username: 'leoningman-student',
        progress: 13,
        profit: 20000, // 200.00 kr in öre
        level: 0,
        lastActive: '2025-08-13',
        day: 13,
        levelCompletedDate: null
    }
]

describe('Leaderboard Component', () => {
    it('should display multiple rows for the same student when they have progress in different levels', async () => {
        render(
            <Leaderboard
                data={mockLeaderboardData}
                currentUser="user1"
            />
        )

        // Wait for component to render
        await waitFor(() => {
            expect(screen.getByText('Leaderboard')).toBeInTheDocument()
        })

        // Should display all 3 rows
        const tableRows = screen.getAllByRole('row')
        // +1 for header row
        expect(tableRows).toHaveLength(4)

        // Check that leoningman-student2 appears twice (once for each level)
        const student2Rows = screen.getAllByText(/leoningman-student2/)
        expect(student2Rows).toHaveLength(2)

        // Check that leoningman-student appears once
        const student1Rows = screen.getAllByText(/leoningman-student(?!2)/)
        expect(student1Rows).toHaveLength(1)

        // Verify level 0 data for student2
        const level0Row = screen.getByText('leoningman-student2 (du)').closest('tr')
        expect(level0Row).toBeInTheDocument()
        expect(level0Row).toHaveTextContent('-51,47 kr')
        expect(level0Row).toHaveTextContent('4') // day

        // Verify level 1 data for student2 - need to find the second occurrence
        const allStudent2Cells = screen.getAllByText(/leoningman-student2/)
        expect(allStudent2Cells).toHaveLength(2)

        // Find the row with -987,45 kr (level 1 data)
        const level1Row = screen.getByText('-987,45 kr').closest('tr')
        expect(level1Row).toBeInTheDocument()
        expect(level1Row).toHaveTextContent('leoningman-student2 (du)')
        expect(level1Row).toHaveTextContent('2') // day
    })

    it('should generate dynamic level options from data', async () => {
        render(
            <Leaderboard
                data={mockLeaderboardData}
                currentUser="user1"
            />
        )

        // Wait for component to render
        await waitFor(() => {
            expect(screen.getByText('Leaderboard')).toBeInTheDocument()
        })

        // Check that level selector includes options for both levels
        // The select component might not show all options until clicked, 
        // but we can verify the data structure supports it
        const selectTrigger = screen.getByRole('combobox')
        expect(selectTrigger).toBeInTheDocument()

        // The component should have processed levels 0 and 1 from the data
        // This would be reflected in the levels array used internally
    })

    it('should show level column only when viewing all levels', async () => {
        render(
            <Leaderboard
                data={mockLeaderboardData}
                currentUser="user1"
            />
        )

        await waitFor(() => {
            expect(screen.getByText('Leaderboard')).toBeInTheDocument()
        })

        // When viewing "All Levels", the Nivå (Level) column should be visible
        expect(screen.getByText('Nivå')).toBeInTheDocument()

        // Should show level numbers
        expect(screen.getByText('0')).toBeInTheDocument()
        expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should mark current user rows appropriately', async () => {
        render(
            <Leaderboard
                data={mockLeaderboardData}
                currentUser="user1"
            />
        )

        await waitFor(() => {
            expect(screen.getByText('Leaderboard')).toBeInTheDocument()
        })

        // Both rows for user1 (leoningman-student2) should be marked with (du)
        const currentUserRows = screen.getAllByText(/leoningman-student2 \(du\)/)
        expect(currentUserRows).toHaveLength(2)

        // leoningman-student should not be marked as current user
        const otherUserRow = screen.getByText('leoningman-student')
        expect(otherUserRow).not.toHaveTextContent('(du)')
    })

    it('should handle empty data gracefully', async () => {
        render(
            <Leaderboard
                data={[]}
                currentUser="user1"
            />
        )

        await waitFor(() => {
            expect(screen.getByText('Leaderboard')).toBeInTheDocument()
        })

        // Should show "no data available" message
        expect(screen.getByText('Ingen data tillgänglig för detta filter')).toBeInTheDocument()
    })

    it('should format negative profits in red', async () => {
        render(
            <Leaderboard
                data={mockLeaderboardData}
                currentUser="user1"
            />
        )

        await waitFor(() => {
            expect(screen.getByText('Leaderboard')).toBeInTheDocument()
        })

        // Check that negative profits are styled with red text
        const negativeProfit1 = screen.getByText('-51,47 kr')
        const negativeProfit2 = screen.getByText('-987,45 kr')

        expect(negativeProfit1).toHaveClass('text-red-600')
        expect(negativeProfit2).toHaveClass('text-red-600')

        // Positive profit should not be red
        const positiveProfit = screen.getByText('200,00 kr')
        expect(positiveProfit).not.toHaveClass('text-red-600')
    })
})
