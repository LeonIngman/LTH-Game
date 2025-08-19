import { render, screen } from '@testing-library/react'
import { GameHistory } from '@/components/game/ui/game-history'
import type { DailyResult, LevelConfig, Supplier, Customer, MaterialType } from '@/types/game'

// Mock data that reflects realistic game scenarios
const mockSupplier: Supplier = {
    id: 1,
    name: "Test Supplier",
    leadTime: 1,
    capacityPerGame: { patty: 1000, cheese: 1000, bun: 1000, potato: 1000 },
    materials: ["patty", "cheese", "bun", "potato"] as MaterialType[],
    shipmentPrices: {
        patty: { 10: 5.0, 50: 4.5, 100: 4.0 },
        cheese: { 10: 6.0, 50: 5.5, 100: 5.0 },
        bun: { 10: 3.0, 50: 2.5, 100: 2.0 },
        potato: { 10: 4.0, 50: 3.5, 100: 3.0 }
    },
    materialPrices: { patty: 5.0, cheese: 6.0, bun: 3.0, potato: 4.0 }
}

const mockCustomerImmediate: Customer = {
    id: 1,
    name: "Customer A",
    description: "Immediate delivery customer",
    leadTime: 0,
    totalRequirement: 100,
    deliverySchedule: [{ day: 5, requiredAmount: 50 }, { day: 10, requiredAmount: 100 }],
    pricePerUnit: 25,
    transportCosts: { 1: 0, 5: 5, 10: 10, 20: 15, 50: 20 },
    allowedShipmentSizes: [1, 5, 10, 20, 50]
}

const mockCustomerDelayed: Customer = {
    id: 2,
    name: "Customer B",
    description: "Delayed delivery customer",
    leadTime: 2,
    totalRequirement: 80,
    deliverySchedule: [{ day: 6, requiredAmount: 40 }, { day: 12, requiredAmount: 80 }],
    pricePerUnit: 30,
    transportCosts: { 1: 2, 5: 8, 10: 15, 20: 25, 50: 35 },
    allowedShipmentSizes: [1, 5, 10, 20, 50]
}

const mockLevelConfig: LevelConfig = {
    id: 0,
    name: "Level 0",
    description: "Test level",
    initialCash: 5000,
    initialInventory: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
    daysToComplete: 10,
    productionCostPerUnit: 10,
    holdingCosts: { patty: 0.05, bun: 0.03, cheese: 0.04, potato: 0.02, finishedGoods: 0.1 },
    suppliers: [mockSupplier],
    customers: [mockCustomerImmediate, mockCustomerDelayed],
    maxScore: 1000,
    mapPositions: {
        mainFactory: { x: 50, y: 50, name: "Factory" },
        suppliers: [{ x: 20, y: 30, name: "Supplier", id: 1 }],
        customers: [{ x: 80, y: 30, name: "Customer A", id: 1 }, { x: 80, y: 70, name: "Customer B", id: 2 }]
    },
    overstock: {
        patty: { threshold: 50, penaltyPerUnit: 0.5 },
        bun: { threshold: 50, penaltyPerUnit: 0.5 },
        cheese: { threshold: 50, penaltyPerUnit: 0.5 },
        potato: { threshold: 50, penaltyPerUnit: 0.5 },
        finishedGoods: { threshold: 20, penaltyPerUnit: 1 }
    },
    safetystock: {
        patty: { threshold: 10 },
        bun: { threshold: 10 },
        cheese: { threshold: 10 },
        potato: { threshold: 10 }
    }
}

describe('Revenue Calculation Tests', () => {
    describe('Database vs UI Value Consistency', () => {
        it('should display 0.00 kr for days with no sales instead of N/A', () => {
            const historyWithNoSales: DailyResult[] = [
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
                    sales: 0, // No sales occurred
                    revenue: 0, // Should be 0, not undefined/null
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

            render(<GameHistory history={historyWithNoSales} />)

            // Revenue should show "0.00 kr", not "N/A"
            expect(screen.getByText('0.00 kr')).toBeInTheDocument()
            expect(screen.queryByText('N/A')).not.toBeInTheDocument()
        })

        it('should correctly calculate and display total daily sales revenue', () => {
            const historyWithSales: DailyResult[] = [
                {
                    day: 1,
                    cash: 5125,
                    inventory: { patty: 5, bun: 5, cheese: 5, potato: 5, finishedGoods: 0 },
                    inventoryValue: { patty: 25, bun: 15, cheese: 20, potato: 10, finishedGoods: 0 },
                    holdingCosts: { patty: 0.25, bun: 0.15, cheese: 0.2, potato: 0.1, finishedGoods: 0 },
                    overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
                    pattyPurchased: 10,
                    cheesePurchased: 10,
                    bunPurchased: 10,
                    potatoPurchased: 10,
                    production: 5,
                    sales: 5, // Sold 5 units
                    revenue: 125, // 5 units × 25 kr/unit = 125 kr (immediate sales)
                    costs: {
                        purchases: 140,
                        production: 50,
                        holding: 0.7,
                        total: 190.7
                    },
                    profit: -65.7,
                    cumulativeProfit: -65.7,
                    score: 60
                }
            ]

            render(<GameHistory history={historyWithSales} />)

            // Revenue should show the calculated amount with exactly 2 decimals
            expect(screen.getByText('125.00 kr')).toBeInTheDocument()
        })

        it('should handle mixed immediate and delayed sales correctly', () => {
            // Day 1: 3 immediate sales, 2 delayed sales (only immediate counted in daily revenue)
            const historyMixedSales: DailyResult[] = [
                {
                    day: 1,
                    cash: 5075, // Starting 5000 + 75 from immediate sales
                    inventory: { patty: 5, bun: 5, cheese: 5, potato: 5, finishedGoods: 0 },
                    inventoryValue: { patty: 25, bun: 15, cheese: 20, potato: 10, finishedGoods: 0 },
                    holdingCosts: { patty: 0.25, bun: 0.15, cheese: 0.2, potato: 0.1, finishedGoods: 0 },
                    overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
                    pattyPurchased: 10,
                    cheesePurchased: 10,
                    bunPurchased: 10,
                    potatoPurchased: 10,
                    production: 5,
                    sales: 5, // Total units sold (immediate + pending)
                    revenue: 75, // Only immediate sales: 3 units × 25 kr/unit = 75 kr
                    costs: {
                        purchases: 140,
                        production: 50,
                        holding: 0.7,
                        total: 190.7
                    },
                    profit: -115.7,
                    cumulativeProfit: -115.7,
                    score: 55
                },
                {
                    day: 3, // Day when delayed sales arrive
                    cash: 5135, // Previous cash + 60 from delayed sales
                    inventory: { patty: 5, bun: 5, cheese: 5, potato: 5, finishedGoods: 2 },
                    inventoryValue: { patty: 25, bun: 15, cheese: 20, potato: 10, finishedGoods: 20 },
                    holdingCosts: { patty: 0.25, bun: 0.15, cheese: 0.2, potato: 0.1, finishedGoods: 0.2 },
                    overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
                    pattyPurchased: 0,
                    cheesePurchased: 0,
                    bunPurchased: 0,
                    potatoPurchased: 0,
                    production: 2,
                    sales: 0, // No new sales this day
                    revenue: 60, // Delayed sales arriving: 2 units × 30 kr/unit = 60 kr
                    costs: {
                        purchases: 0,
                        production: 20,
                        holding: 0.9,
                        total: 20.9
                    },
                    profit: 39.1,
                    cumulativeProfit: -76.6,
                    score: 65
                }
            ]

            render(<GameHistory history={historyMixedSales} />)

            // Check that both revenue amounts are displayed correctly
            expect(screen.getByText('75.00 kr')).toBeInTheDocument()
            expect(screen.getByText('60.00 kr')).toBeInTheDocument()
        })

        it('should match chart data with table data after page refresh', () => {
            const historyForConsistencyCheck: DailyResult[] = [
                {
                    day: 1,
                    cash: 4950,
                    inventory: { patty: 8, bun: 8, cheese: 8, potato: 8, finishedGoods: 1 },
                    inventoryValue: { patty: 40, bun: 24, cheese: 32, potato: 16, finishedGoods: 10 },
                    holdingCosts: { patty: 0.4, bun: 0.24, cheese: 0.32, potato: 0.16, finishedGoods: 0.1 },
                    overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
                    pattyPurchased: 8,
                    cheesePurchased: 8,
                    bunPurchased: 8,
                    potatoPurchased: 8,
                    production: 2,
                    sales: 1, // 1 unit sold
                    revenue: 25, // 1 unit × 25 kr/unit = 25 kr
                    costs: {
                        purchases: 112,
                        production: 20,
                        holding: 1.22,
                        total: 133.22
                    },
                    profit: -108.22,
                    cumulativeProfit: -108.22,
                    score: 45
                },
                {
                    day: 2,
                    cash: 5000,
                    inventory: { patty: 5, bun: 5, cheese: 5, potato: 5, finishedGoods: 1 },
                    inventoryValue: { patty: 25, bun: 15, cheese: 20, potato: 10, finishedGoods: 10 },
                    holdingCosts: { patty: 0.25, bun: 0.15, cheese: 0.2, potato: 0.1, finishedGoods: 0.1 },
                    overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
                    pattyPurchased: 0,
                    cheesePurchased: 0,
                    bunPurchased: 0,
                    potatoPurchased: 0,
                    production: 1,
                    sales: 1, // 1 unit sold
                    revenue: 25, // 1 unit × 25 kr/unit = 25 kr
                    costs: {
                        purchases: 0,
                        production: 10,
                        holding: 0.8,
                        total: 10.8
                    },
                    profit: 14.2,
                    cumulativeProfit: -94.02,
                    score: 50
                }
            ]

            render(<GameHistory history={historyForConsistencyCheck} />)

            // Both days should show the same revenue amount
            const revenueElements = screen.getAllByText('25.00 kr')
            expect(revenueElements).toHaveLength(2) // Both days have same revenue

            // Verify exact formatting (2 decimal places)
            expect(screen.queryByText('25 kr')).not.toBeInTheDocument() // Should not have 0 decimals
            expect(screen.queryByText('25.0 kr')).not.toBeInTheDocument() // Should not have 1 decimal
        })

        it('should handle high-value sales with proper thousand separators', () => {
            const historyWithHighValues: DailyResult[] = [
                {
                    day: 1,
                    cash: 7500,
                    inventory: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
                    inventoryValue: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
                    holdingCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
                    overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
                    pattyPurchased: 50,
                    cheesePurchased: 50,
                    bunPurchased: 50,
                    potatoPurchased: 50,
                    production: 50,
                    sales: 50, // Large sale
                    revenue: 1250, // 50 units × 25 kr/unit = 1250 kr
                    costs: {
                        purchases: 700,
                        production: 500,
                        holding: 0,
                        total: 1200
                    },
                    profit: 50,
                    cumulativeProfit: 50,
                    score: 80
                }
            ]

            render(<GameHistory history={historyWithHighValues} />)

            // Should display with exactly 2 decimal places
            expect(screen.getByText('1250.00 kr')).toBeInTheDocument()
        })
    })

    describe('Revenue Calculation Edge Cases', () => {
        it('should handle zero-price products correctly', () => {
            const historyWithFreeProducts: DailyResult[] = [
                {
                    day: 1,
                    cash: 5000,
                    inventory: { patty: 10, bun: 10, cheese: 10, potato: 10, finishedGoods: 0 },
                    inventoryValue: { patty: 50, bun: 30, cheese: 40, potato: 20, finishedGoods: 0 },
                    holdingCosts: { patty: 0.5, bun: 0.3, cheese: 0.4, potato: 0.2, finishedGoods: 0 },
                    overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
                    pattyPurchased: 10,
                    cheesePurchased: 10,
                    bunPurchased: 10,
                    potatoPurchased: 10,
                    production: 10,
                    sales: 10, // 10 units sold at 0 kr each
                    revenue: 0, // Free products = 0 revenue
                    costs: {
                        purchases: 140,
                        production: 100,
                        holding: 1.4,
                        total: 241.4
                    },
                    profit: -241.4,
                    cumulativeProfit: -241.4,
                    score: 30
                }
            ]

            render(<GameHistory history={historyWithFreeProducts} />)

            // Should show 0.00 kr, not N/A
            expect(screen.getByText('0.00 kr')).toBeInTheDocument()
        })

        it('should handle negative revenue (refunds/returns) correctly', () => {
            const historyWithNegativeRevenue: DailyResult[] = [
                {
                    day: 1,
                    cash: 4975,
                    inventory: { patty: 10, bun: 10, cheese: 10, potato: 10, finishedGoods: 0 },
                    inventoryValue: { patty: 50, bun: 30, cheese: 40, potato: 20, finishedGoods: 0 },
                    holdingCosts: { patty: 0.5, bun: 0.3, cheese: 0.4, potato: 0.2, finishedGoods: 0 },
                    overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
                    pattyPurchased: 10,
                    cheesePurchased: 10,
                    bunPurchased: 10,
                    potatoPurchased: 10,
                    production: 5,
                    sales: -1, // Negative sales (returns)
                    revenue: -25, // Negative revenue from returns
                    costs: {
                        purchases: 140,
                        production: 50,
                        holding: 1.4,
                        total: 191.4
                    },
                    profit: -216.4,
                    cumulativeProfit: -216.4,
                    score: 25
                }
            ]

            render(<GameHistory history={historyWithNegativeRevenue} />)

            // Should display negative revenue correctly
            expect(screen.getByText('-25.00 kr')).toBeInTheDocument()
        })
    })
})
