import { render, screen } from '@testing-library/react'
import { GameHistory } from '@/components/game/ui/game-history'
import type { DailyResult } from '@/types/game'

describe('GameHistory Legacy Data Compatibility', () => {
    it('should handle legacy data with null revenue values correctly', () => {
        // Simulate legacy game history data that might have null revenue
        const legacyHistoryWithNullRevenue: DailyResult[] = [
            {
                day: 1,
                cash: 5000,
                inventory: { patty: 10, bun: 10, cheese: 10, potato: 10, finishedGoods: 5 },
                inventoryValue: { patty: 50, bun: 30, cheese: 40, potato: 20, finishedGoods: 50 },
                holdingCosts: { patty: 0.5, bun: 0.3, cheese: 0.4, potato: 0.2, finishedGoods: 0.5 },
                overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
                pattyPurchased: 10,
                cheesePurchased: 10,
                bunPurchased: 10,
                potatoPurchased: 10,
                production: 5,
                sales: 0,
                revenue: null as any, // Legacy data might have null revenue
                costs: {
                    purchases: 140,
                    production: 50,
                    holding: 1.9,
                    total: 191.9
                },
                profit: -191.9,
                cumulativeProfit: -191.9,
                score: 50
            }
        ]

        render(<GameHistory history={legacyHistoryWithNullRevenue} />)

        // Should show "0.00 kr" instead of "N/A" for null revenue
        expect(screen.getByText('0.00 kr')).toBeInTheDocument()
        expect(screen.queryByText('N/A')).not.toBeInTheDocument()
    })

    it('should handle legacy data with undefined revenue values correctly', () => {
        // Simulate legacy game history data that might have undefined revenue
        const legacyHistoryWithUndefinedRevenue: DailyResult[] = [
            {
                day: 1,
                cash: 4850,
                inventory: { patty: 5, bun: 5, cheese: 5, potato: 5, finishedGoods: 2 },
                inventoryValue: { patty: 25, bun: 15, cheese: 20, potato: 10, finishedGoods: 20 },
                holdingCosts: { patty: 0.25, bun: 0.15, cheese: 0.2, potato: 0.1, finishedGoods: 0.2 },
                overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
                pattyPurchased: 5,
                cheesePurchased: 5,
                bunPurchased: 5,
                potatoPurchased: 5,
                production: 2,
                sales: 2,
                revenue: undefined as any, // Legacy data might have undefined revenue
                costs: {
                    purchases: 70,
                    production: 20,
                    holding: 0.9,
                    total: 90.9
                },
                profit: -90.9,
                cumulativeProfit: -90.9,
                score: 60
            }
        ]

        render(<GameHistory history={legacyHistoryWithUndefinedRevenue} />)

        // Should show "0.00 kr" instead of "N/A" for undefined revenue
        expect(screen.getByText('0.00 kr')).toBeInTheDocument()
        expect(screen.queryByText('N/A')).not.toBeInTheDocument()
    })

    it('should handle mixed legacy and new data correctly', () => {
        // Mix of legacy (null/undefined revenue) and new (proper number revenue) data
        const mixedHistoryData: DailyResult[] = [
            {
                day: 1,
                cash: 5000,
                inventory: { patty: 10, bun: 10, cheese: 10, potato: 10, finishedGoods: 5 },
                inventoryValue: { patty: 50, bun: 30, cheese: 40, potato: 20, finishedGoods: 50 },
                holdingCosts: { patty: 0.5, bun: 0.3, cheese: 0.4, potato: 0.2, finishedGoods: 0.5 },
                overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
                pattyPurchased: 10,
                cheesePurchased: 10,
                bunPurchased: 10,
                potatoPurchased: 10,
                production: 5,
                sales: 0,
                revenue: null as any, // Legacy data
                costs: {
                    purchases: 140,
                    production: 50,
                    holding: 1.9,
                    total: 191.9
                },
                profit: -191.9,
                cumulativeProfit: -191.9,
                score: 50
            },
            {
                day: 2,
                cash: 5125,
                inventory: { patty: 5, bun: 5, cheese: 5, potato: 5, finishedGoods: 0 },
                inventoryValue: { patty: 25, bun: 15, cheese: 20, potato: 10, finishedGoods: 0 },
                holdingCosts: { patty: 0.25, bun: 0.15, cheese: 0.2, potato: 0.1, finishedGoods: 0 },
                overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
                pattyPurchased: 0,
                cheesePurchased: 0,
                bunPurchased: 0,
                potatoPurchased: 0,
                production: 0,
                sales: 5,
                revenue: 125, // New data with proper revenue calculation
                costs: {
                    purchases: 0,
                    production: 0,
                    holding: 0.7,
                    total: 0.7
                },
                profit: 124.3,
                cumulativeProfit: -67.6,
                score: 75
            }
        ]

        render(<GameHistory history={mixedHistoryData} />)

        // Should show "0.00 kr" for legacy null revenue and "125.00 kr" for new proper revenue
        expect(screen.getByText('0.00 kr')).toBeInTheDocument() // Day 1 legacy data
        expect(screen.getByText('125.00 kr')).toBeInTheDocument() // Day 2 new data
        expect(screen.queryByText('N/A')).not.toBeInTheDocument() // No "N/A" should appear
    })

    it('should maintain sorting functionality with mixed data types', () => {
        // Test that sorting still works when some revenue values are null/undefined
        const sortableHistoryData: DailyResult[] = [
            {
                day: 1,
                cash: 5000,
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
                revenue: 250, // High revenue
                costs: { purchases: 0, production: 0, holding: 0, total: 0 },
                profit: 250,
                cumulativeProfit: 250,
                score: 100
            },
            {
                day: 2,
                cash: 5000,
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
                revenue: null as any, // Legacy null revenue
                costs: { purchases: 0, production: 0, holding: 0, total: 0 },
                profit: 0,
                cumulativeProfit: 250,
                score: 80
            }
        ]

        render(<GameHistory history={sortableHistoryData} />)

        // Should not show any "N/A" values anywhere in the table
        expect(screen.queryByText('N/A')).not.toBeInTheDocument()
    })
});
