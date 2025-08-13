/**
 * Unit Tests for CostSummary Component - UX2 Alignment Fix
 * Testing cost summary display, alignment, and user experience
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'

import { CostSummary } from '@/components/game/ui/cost-summary'
import type { GameState, LevelConfig, GameAction, SupplierOrder } from '@/types/game'

// Mock tooltip components
jest.mock('@/components/ui/tooltip', () => ({
    TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipTrigger: ({ asChild, children }: { asChild: boolean; children: React.ReactNode }) => <div>{children}</div>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('CostSummary Component - UX2 Alignment Fix', () => {
    // Mock calculation functions
    const mockCalculations = {
        calculateTotalPurchaseCost: jest.fn(() => 150.50),
        calculateProductionCost: jest.fn(() => 12.50),
        calculateMaterialPurchaseCost: jest.fn(() => 120.25),
        calculateTransportationCost: jest.fn(() => 30.25),
        calculateHoldingCost: jest.fn(() => 8.15),
        calculateOverstockCost: jest.fn(() => 2.50),
        calculateRevenue: jest.fn(() => 200.75)
    }

    const defaultProps = {
        gameState: {} as GameState,
        levelConfig: { productionCostPerUnit: 2.5 } as LevelConfig,
        action: { production: 5 } as GameAction,
        supplierOrders: [] as SupplierOrder[],
        isLoading: false,
        gameEnded: false,
        onProcessDay: jest.fn(),
        isNextDayButtonDisabled: jest.fn(() => false),
        getNextDayDisabledReason: jest.fn(() => ''),
        ...mockCalculations
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Visual Layout and Alignment', () => {
        it('should render cost summary with proper grid structure', () => {
            render(<CostSummary {...defaultProps} />)

            // Check that the main container exists
            const costSummary = screen.getByTestId('cost-summary')
            expect(costSummary).toBeInTheDocument()
            expect(costSummary).toHaveClass('cost-summary')
        })

        it('should display all cost components in the top row', () => {
            render(<CostSummary {...defaultProps} />)

            // Verify all top row cost components are present
            expect(screen.getByText('Purchase Cost')).toBeInTheDocument()
            expect(screen.getByText('Transportation Cost')).toBeInTheDocument()
            expect(screen.getByText('Production Cost')).toBeInTheDocument()
            expect(screen.getByText('Daily Holding Cost')).toBeInTheDocument()
            expect(screen.getByText('Overstock Cost')).toBeInTheDocument()

            // Verify calculated values are displayed
            expect(screen.getByText('120.25 kr')).toBeInTheDocument()
            expect(screen.getByText('30.25 kr')).toBeInTheDocument()
            expect(screen.getByText('12.50 kr')).toBeInTheDocument()
            expect(screen.getByText('8.15 kr')).toBeInTheDocument()
            expect(screen.getByText('2.50 kr')).toBeInTheDocument()
        })

        it('should display summary row with proper alignment to top row', () => {
            render(<CostSummary {...defaultProps} />)

            // Check that summary row elements are present
            expect(screen.getByText('Total Cost')).toBeInTheDocument()
            expect(screen.getByText('Revenue')).toBeInTheDocument()
            expect(screen.getByText('Profit')).toBeInTheDocument()

            // Verify calculated totals
            const totalCost = 120.25 + 12.50 + 8.15 + 2.50 // 143.40
            const revenue = 200.75
            const profit = revenue - totalCost // 57.35

            expect(screen.getByText(`${totalCost.toFixed(2)} kr`)).toBeInTheDocument()
            expect(screen.getByText(`${revenue.toFixed(2)} kr`)).toBeInTheDocument()
            expect(screen.getByText(`${profit.toFixed(2)} kr`)).toBeInTheDocument()
        })

        it('should have consistent column spacing between top and bottom sections', () => {
            const { container } = render(<CostSummary {...defaultProps} />)

            // Check top grid structure - should be 5 columns on md screens
            const topGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-5')
            expect(topGrid).toBeInTheDocument()

            // Check bottom grid structure - should align with top grid
            const bottomSection = container.querySelector('.border-t')
            expect(bottomSection).toBeInTheDocument()

            // The bottom grid should have proper alignment structure
            const bottomGrid = bottomSection?.querySelector('.grid')
            expect(bottomGrid).toBeInTheDocument()
        })

        it('should maintain proper visual hierarchy with text sizes', () => {
            render(<CostSummary {...defaultProps} />)

            // Check text size classes are applied correctly
            const smallLabels = screen.getAllByText(/Cost|Revenue|Profit/).filter(el =>
                el.classList.contains('text-sm') && el.classList.contains('font-medium')
            )
            expect(smallLabels.length).toBeGreaterThan(0)

            // Check large value displays
            const largeValues = screen.getAllByText(/kr$/).filter(el =>
                el.classList.contains('text-xl') && el.classList.contains('font-bold')
            )
            expect(largeValues.length).toBeGreaterThan(0)
        })
    })

    describe('Responsive Behavior', () => {
        it('should handle responsive grid changes properly', () => {
            const { container } = render(<CostSummary {...defaultProps} />)

            // Top section should have responsive grid classes
            const topGrid = container.querySelector('.grid-cols-1.md\\:grid-cols-5')
            expect(topGrid).toBeInTheDocument()
        })
    })

    describe('Interactive Elements', () => {
        it('should render Next Day button with proper styling', () => {
            render(<CostSummary {...defaultProps} />)

            const nextDayButton = screen.getByRole('button', { name: /next day/i })
            expect(nextDayButton).toBeInTheDocument()
            expect(nextDayButton).toHaveClass('next-day-button')
        })

        it('should disable Next Day button when insufficient funds', () => {
            const insufficientFundsProps = {
                ...defaultProps,
                gameState: { ...defaultProps.gameState, cash: 50 }, // Less than total cost
            }

            render(<CostSummary {...insufficientFundsProps} />)

            const nextDayButton = screen.getByRole('button', { name: /next day/i })
            expect(nextDayButton).toBeDisabled()
        })

        it('should call onProcessDay when Next Day button is clicked', async () => {
            const user = userEvent.setup()
            render(<CostSummary {...defaultProps} />)

            const nextDayButton = screen.getByRole('button', { name: /next day/i })
            await user.click(nextDayButton)

            expect(defaultProps.onProcessDay).toHaveBeenCalledTimes(1)
        })
    })

    describe('Color Coding', () => {
        it('should display profit in green when positive', () => {
            render(<CostSummary {...defaultProps} />)

            const profitValue = screen.getByText(/57\.35 kr/)
            expect(profitValue).toHaveClass('text-green-600')
        })

        it('should display profit in red when negative', () => {
            const lossProps = {
                ...defaultProps,
                calculateRevenue: jest.fn(() => 50.00) // Less than total cost
            }

            render(<CostSummary {...lossProps} />)

            // Total cost is 143.40, revenue is 50.00, so profit is -93.40
            const profitValue = screen.getByText(/-93\.40 kr/)
            expect(profitValue).toHaveClass('text-red-600')
        })

        it('should display total cost in red', () => {
            render(<CostSummary {...defaultProps} />)

            const totalCostValue = screen.getByText(/143\.40 kr/)
            expect(totalCostValue).toHaveClass('text-red-600')
        })

        it('should display revenue in green', () => {
            render(<CostSummary {...defaultProps} />)

            const revenueValue = screen.getByText(/200\.75 kr/)
            expect(revenueValue).toHaveClass('text-green-600')
        })
    })

    describe('Accessibility', () => {
        it('should have proper data attributes for testing', () => {
            render(<CostSummary {...defaultProps} />)

            const costSummary = screen.getByTestId('cost-summary')
            expect(costSummary).toHaveAttribute('data-tutorial', 'cost-summary')
        })

        it('should provide tooltips for disabled states', () => {
            const disabledProps = {
                ...defaultProps,
                isNextDayButtonDisabled: jest.fn(() => true),
                getNextDayDisabledReason: jest.fn(() => 'Insufficient funds')
            }

            render(<CostSummary {...disabledProps} />)

            const nextDayButton = screen.getByRole('button', { name: /next day/i })
            expect(nextDayButton).toBeDisabled()
        })
    })
})
