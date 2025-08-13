/**
 * Unit Tests for GameHistory Sortable Columns - UX3 Implementation
 * Testing sorting functionality, arrow indicators, and user interactions
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import type { DailyResult } from '@/types/game'

// Mock the UI components
jest.mock('@/components/ui/card', () => ({
    Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
    CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
    CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
    CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
    CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
}))

jest.mock('@/components/ui/table', () => ({
    Table: ({ children }: any) => <table data-testid="table">{children}</table>,
    TableBody: ({ children }: any) => <tbody data-testid="table-body">{children}</tbody>,
    TableCell: ({ children, className }: any) => <td className={className} data-testid="table-cell">{children}</td>,
    TableHead: ({ children, className }: any) => <th className={className} data-testid="table-head">{children}</th>,
    TableHeader: ({ children }: any) => <thead data-testid="table-header">{children}</thead>,
    TableRow: ({ children }: any) => <tr data-testid="table-row">{children}</tr>,
}))

// Import the component after mocking dependencies
import { GameHistory } from '@/components/game/ui/game-history'

describe('GameHistory Sortable Columns - UX3', () => {
    // Test data with multiple days for sorting
    const mockHistoryData: DailyResult[] = [
        {
            day: 1,
            cash: 1000.50,
            revenue: 200.75,
            costs: { purchases: 100, production: 50, holding: 10, total: 160 },
            profit: 40.75,
            cumulativeProfit: 40.75,
            score: 85,
            inventory: { patty: 10, bun: 10, cheese: 10, potato: 10, finishedGoods: 0 },
            inventoryValue: { patty: 100, bun: 50, cheese: 80, potato: 40, finishedGoods: 0 },
            holdingCosts: { patty: 2, bun: 1, cheese: 1.6, potato: 0.8, finishedGoods: 0 },
            overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
            pattyPurchased: 10,
            cheesePurchased: 5,
            bunPurchased: 8,
            potatoPurchased: 3,
            production: 5,
            sales: 3,
        },
        {
            day: 2,
            cash: 800.25,
            revenue: 150.50,
            costs: { purchases: 80, production: 40, holding: 12, total: 132 },
            profit: 18.50,
            cumulativeProfit: 59.25,
            score: 92,
            inventory: { patty: 8, bun: 8, cheese: 8, potato: 8, finishedGoods: 2 },
            inventoryValue: { patty: 80, bun: 40, cheese: 64, potato: 32, finishedGoods: 40 },
            holdingCosts: { patty: 1.6, bun: 0.8, cheese: 1.28, potato: 0.64, finishedGoods: 0.8 },
            overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
            pattyPurchased: 0,
            cheesePurchased: 0,
            bunPurchased: 0,
            potatoPurchased: 0,
            production: 4,
            sales: 2,
        },
        {
            day: 3,
            cash: 1200.00,
            revenue: 300.00,
            costs: { purchases: 120, production: 60, holding: 8, total: 188 },
            profit: 112.00,
            cumulativeProfit: 171.25,
            score: 78,
            inventory: { patty: 15, bun: 15, cheese: 15, potato: 15, finishedGoods: 1 },
            inventoryValue: { patty: 150, bun: 75, cheese: 120, potato: 60, finishedGoods: 20 },
            holdingCosts: { patty: 3, bun: 1.5, cheese: 2.4, potato: 1.2, finishedGoods: 0.4 },
            overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
            pattyPurchased: 15,
            cheesePurchased: 10,
            bunPurchased: 12,
            potatoPurchased: 8,
            production: 6,
            sales: 4,
        }
    ]

    const mockHistoryWithNulls: DailyResult[] = [
        ...mockHistoryData,
        {
            day: 4,
            cash: null as any,
            revenue: null as any,
            costs: null as any,
            profit: null as any,
            cumulativeProfit: null as any,
            score: null as any,
            inventory: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
            inventoryValue: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
            holdingCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
            overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
            pattyPurchased: 0,
            cheesePurchased: 0,
            bunPurchased: 0,
            potatoPurchased: 0,
            production: 0,
            sales: 0,
        }
    ]

    describe('Sortable Column Headers', () => {
        it('should render column headers with sort arrows', () => {
            render(<GameHistory history={mockHistoryData} />)

            // Check that column headers exist
            expect(screen.getByText('Day')).toBeInTheDocument()
            expect(screen.getByText('Cash')).toBeInTheDocument()
            expect(screen.getByText('Revenue')).toBeInTheDocument()
            expect(screen.getByText('Costs')).toBeInTheDocument()
            expect(screen.getByText('Profit')).toBeInTheDocument()
            expect(screen.getByText('Cum. Profit')).toBeInTheDocument()
            expect(screen.getByText('Score')).toBeInTheDocument()

            // Check that sort buttons exist for each column
            const sortButtons = screen.getAllByRole('button')
            expect(sortButtons).toHaveLength(14) // 7 columns × 2 arrows (up/down) each
        })

        it('should display up and down arrow buttons for each column', () => {
            render(<GameHistory history={mockHistoryData} />)

            // Check for ascending sort buttons (up arrows) - use specific labels
            expect(screen.getByLabelText('Sort Day ascending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Cash ascending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Revenue ascending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Costs ascending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Profit ascending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Cum. Profit ascending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Score ascending')).toBeInTheDocument()

            // Check for descending sort buttons (down arrows)
            expect(screen.getByLabelText('Sort Day descending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Cash descending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Revenue descending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Costs descending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Profit descending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Cum. Profit descending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Score descending')).toBeInTheDocument()
        })

        it('should highlight active sort indicator', () => {
            render(<GameHistory history={mockHistoryData} />)

            // Initially, no sort should be active
            const activeIndicators = screen.queryAllByTestId('active-sort-indicator')
            expect(activeIndicators).toHaveLength(0)
        })
    })

    describe('Sorting Functionality', () => {
        it('should sort by Day column in ascending order', async () => {
            const user = userEvent.setup()
            render(<GameHistory history={mockHistoryData} />)

            // Click ascending sort on Day column
            const dayAscButton = screen.getByLabelText('Sort Day ascending')
            await user.click(dayAscButton)

            // Check that rows are sorted by day (1, 2, 3)
            const tableCells = screen.getAllByTestId('table-cell')
            const dayCells = tableCells.filter((_, index) => index % 7 === 0) // First cell of each row
            
            expect(dayCells[0]).toHaveTextContent('1')
            expect(dayCells[1]).toHaveTextContent('2')
            expect(dayCells[2]).toHaveTextContent('3')

            // Check that the active sort indicator is shown
            expect(screen.getByTestId('active-sort-indicator')).toBeInTheDocument()
        })

        it('should sort by Day column in descending order', async () => {
            const user = userEvent.setup()
            render(<GameHistory history={mockHistoryData} />)

            // Click descending sort on Day column
            const dayDescButton = screen.getByLabelText('Sort Day descending')
            await user.click(dayDescButton)

            // Check that rows are sorted by day in reverse (3, 2, 1)
            const tableCells = screen.getAllByTestId('table-cell')
            const dayCells = tableCells.filter((_, index) => index % 7 === 0) // First cell of each row
            
            expect(dayCells[0]).toHaveTextContent('3')
            expect(dayCells[1]).toHaveTextContent('2')
            expect(dayCells[2]).toHaveTextContent('1')
        })

        it('should sort by Cash column numerically', async () => {
            const user = userEvent.setup()
            render(<GameHistory history={mockHistoryData} />)

            // Click ascending sort on Cash column
            const cashAscButton = screen.getByLabelText('Sort Cash ascending')
            await user.click(cashAscButton)

            // Check that rows are sorted by cash value (800.25, 1000.50, 1200.00)
            const tableCells = screen.getAllByTestId('table-cell')
            const cashCells = tableCells.filter((_, index) => index % 7 === 1) // Second cell of each row
            
            expect(cashCells[0]).toHaveTextContent('800.25 kr')
            expect(cashCells[1]).toHaveTextContent('1000.50 kr')
            expect(cashCells[2]).toHaveTextContent('1200.00 kr')
        })

        it('should sort by Score column numerically', async () => {
            const user = userEvent.setup()
            render(<GameHistory history={mockHistoryData} />)

            // Click descending sort on Score column
            const scoreDescButton = screen.getByLabelText('Sort Score descending')
            await user.click(scoreDescButton)

            // Check that rows are sorted by score in descending order (92, 85, 78)
            const tableCells = screen.getAllByTestId('table-cell')
            const scoreCells = tableCells.filter((_, index) => index % 7 === 6) // Last cell of each row
            
            expect(scoreCells[0]).toHaveTextContent('92')
            expect(scoreCells[1]).toHaveTextContent('85')
            expect(scoreCells[2]).toHaveTextContent('78')
        })

        it('should handle N/A values by placing them at the bottom', async () => {
            const user = userEvent.setup()
            render(<GameHistory history={mockHistoryWithNulls} />)

            // Click ascending sort on Cash column
            const cashAscButton = screen.getByLabelText('Sort Cash ascending')
            await user.click(cashAscButton)

            // Check that N/A values are at the bottom
            const tableCells = screen.getAllByTestId('table-cell')
            const cashCells = tableCells.filter((_, index) => index % 7 === 1) // Second cell of each row
            
            // First three should be numeric values sorted
            expect(cashCells[0]).toHaveTextContent('800.25 kr')
            expect(cashCells[1]).toHaveTextContent('1000.50 kr')
            expect(cashCells[2]).toHaveTextContent('1200.00 kr')
            
            // Last should be N/A
            expect(cashCells[3]).toHaveTextContent('N/A')
        })
    })

    describe('Visual Indicators', () => {
        it('should highlight the active sort arrow', async () => {
            const user = userEvent.setup()
            render(<GameHistory history={mockHistoryData} />)

            // Click ascending sort on Day column
            const dayAscButton = screen.getByLabelText('Sort Day ascending')
            await user.click(dayAscButton)

            // Check that the active arrow is highlighted
            expect(dayAscButton).toHaveClass('text-primary') // or whatever active class is used
        })

        it('should remove highlight from previous sort when new sort is applied', async () => {
            const user = userEvent.setup()
            render(<GameHistory history={mockHistoryData} />)

            // Click ascending sort on Day column
            const dayAscButton = screen.getByLabelText('Sort Day ascending')
            await user.click(dayAscButton)

            // Verify Day ascending is active
            expect(dayAscButton).toHaveClass('text-primary')

            // Click ascending sort on Cash column
            const cashAscButton = screen.getByLabelText('Sort Cash ascending')
            await user.click(cashAscButton)

            // Verify Cash ascending is now active and Day is not
            expect(cashAscButton).toHaveClass('text-primary')
            expect(dayAscButton).not.toHaveClass('text-primary')
        })
    })

    describe('Accessibility', () => {
        it('should provide proper aria-labels for sort buttons', () => {
            render(<GameHistory history={mockHistoryData} />)

            // Check that all sort buttons have proper aria-labels
            expect(screen.getByLabelText('Sort Day ascending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Day descending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Cash ascending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Cash descending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Revenue ascending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Revenue descending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Costs ascending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Costs descending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Profit ascending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Profit descending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Cum. Profit ascending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Cum. Profit descending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Score ascending')).toBeInTheDocument()
            expect(screen.getByLabelText('Sort Score descending')).toBeInTheDocument()
        })

        it('should be keyboard accessible', async () => {
            const user = userEvent.setup()
            render(<GameHistory history={mockHistoryData} />)

            const dayAscButton = screen.getByLabelText('Sort Day ascending')
            
            // Focus and activate with keyboard
            dayAscButton.focus()
            expect(dayAscButton).toHaveFocus()
            
            await user.keyboard('{Enter}')
            
            // Check that sorting was applied
            expect(screen.getByTestId('active-sort-indicator')).toBeInTheDocument()
        })
    })
})
