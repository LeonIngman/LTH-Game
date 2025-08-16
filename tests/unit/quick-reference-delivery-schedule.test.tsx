import { render, screen } from '@testing-library/react'
import { QuickReference } from '@/components/game/ui/quick-reference'
import { level0Config } from '@/lib/game/level0'
import type { GameState } from '@/types/game'

// Mock props for QuickReference component
const mockGameState: GameState = {
    day: 3, // Test on day 3 when Yummy Zone has a delivery due
    cash: 1000,
    inventory: { patty: 0, cheese: 0, bun: 0, potato: 0, finishedGoods: 0 },
    inventoryValue: { patty: 0, cheese: 0, bun: 0, potato: 0, finishedGoods: 0 },
    pendingSupplierOrders: [],
    pendingCustomerOrders: [],
    customerDeliveries: { 1: 0, 2: 0, 3: 0 }, // No deliveries made yet
    supplierDeliveries: {},
    history: [],
    cumulativeProfit: 0,
    score: 0,
    gameOver: false,
    latenessPenalties: []
}

const mockProps = {
    levelConfig: level0Config,
    getMaterialPriceForSupplier: jest.fn(() => 10),
    currentDay: 3, // Day 3 - when Yummy Zone has delivery due
    supplierOrders: [],
    gameState: mockGameState,
    onEnablePlanningMode: jest.fn(),
    planningMode: false
}

describe('QuickReference - Delivery Schedule Display', () => {
    it('should correctly display delivery schedule with proper highlighting for due dates', () => {
        render(<QuickReference {...mockProps} />)

        // Switch to customers tab
        const customersTab = screen.getByRole('tab', { name: /customers/i })
        customersTab.click()

        // Check if Yummy Zone delivery schedule is displayed correctly
        expect(screen.getByText('Yummy Zone')).toBeInTheDocument()
        expect(screen.getByText('Delivery Schedule:')).toBeInTheDocument()

        // Check for "Due Today" badge on day 3
        expect(screen.getByText('Due Today')).toBeInTheDocument()

        // Check for correct delivery amounts
        expect(screen.getByText('Day 3: 20 units')).toBeInTheDocument()
        expect(screen.getByText('Day 20: 60 units')).toBeInTheDocument()
    })

    it('should correctly handle different current days', () => {
        // Test with day 20 - when the second delivery is due
        const propsDay20 = {
            ...mockProps,
            currentDay: 20,
            gameState: { ...mockGameState, day: 20 }
        }

        render(<QuickReference {...propsDay20} />)

        // Switch to customers tab
        const customersTab = screen.getByRole('tab', { name: /customers/i })
        customersTab.click()

        // On day 20, the second delivery should be highlighted
        expect(screen.getByText('Due Today')).toBeInTheDocument()
        expect(screen.getByText('Day 20: 60 units')).toBeInTheDocument()
    })

    it('should display delivery schedule from database configuration', () => {
        render(<QuickReference {...mockProps} />)

        // Switch to customers tab
        const customersTab = screen.getByRole('tab', { name: /customers/i })
        customersTab.click()

        // Verify that the data matches what's in level0Config
        const yummyZoneCustomer = level0Config.customers.find(c => c.name === 'Yummy Zone')
        expect(yummyZoneCustomer).toBeDefined()

        if (yummyZoneCustomer) {
            // Verify the delivery schedule data is correctly displayed
            yummyZoneCustomer.deliverySchedule.forEach(milestone => {
                expect(screen.getByText(`Day ${milestone.day}: ${milestone.requiredAmount} units`)).toBeInTheDocument()
            })
        }
    })

    it('should handle past, current, and future deliveries correctly', () => {
        // Test with day 15 - between the two deliveries
        const propsDay15 = {
            ...mockProps,
            currentDay: 15,
            gameState: { ...mockGameState, day: 15 }
        }

        render(<QuickReference {...propsDay15} />)

        // Switch to customers tab
        const customersTab = screen.getByRole('tab', { name: /customers/i })
        customersTab.click()

        // Day 3 should be past (no "Due Today" badge)
        expect(screen.getByText('Day 3: 20 units')).toBeInTheDocument()
        // Day 20 should be future
        expect(screen.getByText('Day 20: 60 units')).toBeInTheDocument()
        // No "Due Today" badge should be present on day 15
        expect(screen.queryByText('Due Today')).not.toBeInTheDocument()
    })

    it('should show "On track" green badge when delivery requirement is met', () => {
        // Test scenario: Day 3, user has delivered 20 units (meeting the Day 3 requirement)
        const propsOnTrack = {
            ...mockProps,
            currentDay: 3,
            gameState: {
                ...mockGameState,
                day: 3,
                customerDeliveries: { 1: 20, 2: 0, 3: 0 } // 20 units delivered to Yummy Zone (customer id 1)
            }
        }

        render(<QuickReference {...propsOnTrack} />)

        // Switch to customers tab
        const customersTab = screen.getByRole('tab', { name: /customers/i })
        customersTab.click()

        // Should show "On track" badge instead of "Due Today"
        expect(screen.getByText('On track')).toBeInTheDocument()
        expect(screen.queryByText('Due Today')).not.toBeInTheDocument()

        // Should still show the delivery requirement
        expect(screen.getByText('Day 3: 20 units')).toBeInTheDocument()

        // Should show delivered status
        expect(screen.getByText('Delivered: 20 / 20 units')).toBeInTheDocument()
    })

    it('should show "Due Today" orange badge when delivery requirement is not met', () => {
        // Test scenario: Day 3, user has delivered only 10 units (below Day 3 requirement of 20)
        const propsBehind = {
            ...mockProps,
            currentDay: 3,
            gameState: {
                ...mockGameState,
                day: 3,
                customerDeliveries: { 1: 10, 2: 0, 3: 0 } // Only 10 units delivered to Yummy Zone
            }
        }

        render(<QuickReference {...propsBehind} />)

        // Switch to customers tab
        const customersTab = screen.getByRole('tab', { name: /customers/i })
        customersTab.click()

        // Should show "Due Today" badge since requirement not met
        expect(screen.getByText('Due Today')).toBeInTheDocument()
        expect(screen.queryByText('On track')).not.toBeInTheDocument()

        // Should still show the delivery requirement
        expect(screen.getByText('Day 3: 20 units')).toBeInTheDocument()
    })

    it('should handle cumulative delivery requirements correctly', () => {
        // Test scenario: Day 20, user needs cumulative 80 units (20 from Day 3 + 60 from Day 20)
        const propsCumulative = {
            ...mockProps,
            currentDay: 20,
            gameState: {
                ...mockGameState,
                day: 20,
                customerDeliveries: { 1: 80, 2: 0, 3: 0 } // 80 units total delivered
            }
        }

        render(<QuickReference {...propsCumulative} />)

        // Switch to customers tab
        const customersTab = screen.getByRole('tab', { name: /customers/i })
        customersTab.click()

        // Should show "On track" for meeting cumulative requirement
        expect(screen.getByText('On track')).toBeInTheDocument()
        expect(screen.getByText('Day 20: 60 units')).toBeInTheDocument()
        expect(screen.getByText('Delivered: 80 / 80 units')).toBeInTheDocument()
    })

    it('should update badge color and status based on database values', () => {
        // Test that the badge reflects real-time database state
        const initialProps = {
            ...mockProps,
            currentDay: 3,
            gameState: {
                ...mockGameState,
                day: 3,
                customerDeliveries: { 1: 0, 2: 0, 3: 0 } // No deliveries initially
            }
        }

        const { rerender } = render(<QuickReference {...initialProps} />)

        // Switch to customers tab
        const customersTab = screen.getByRole('tab', { name: /customers/i })
        customersTab.click()

        // Initially should show "Due Today"
        expect(screen.getByText('Due Today')).toBeInTheDocument()

        // Update game state to reflect completed delivery
        const updatedProps = {
            ...initialProps,
            gameState: {
                ...initialProps.gameState,
                customerDeliveries: { 1: 20, 2: 0, 3: 0 } // Delivery completed
            }
        }

        rerender(<QuickReference {...updatedProps} />)

        // Switch to customers tab again after rerender
        const customersTabAfter = screen.getByRole('tab', { name: /customers/i })
        customersTabAfter.click()

        // Should now show "On track"
        expect(screen.getByText('On track')).toBeInTheDocument()
        expect(screen.queryByText('Due Today')).not.toBeInTheDocument()
    })
})
