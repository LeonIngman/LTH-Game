import { describe, it, expect } from '@jest/globals';
import { processDay } from '@/lib/game/engine';
import type { GameState, LevelConfig, GameAction, Supplier, Customer, MaterialType } from '@/types/game';

// Simple customer order interface for GameAction
interface SimpleCustomerOrder {
    customerId: number;
    quantity: number;
}

// Mock data for testing the game engine revenue calculation
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
};

const mockCustomerImmediate: Customer = {
    id: 1,
    name: "Customer Immediate",
    description: "Immediate delivery customer",
    leadTime: 0, // Immediate sales
    totalRequirement: 100,
    deliverySchedule: [{ day: 5, requiredAmount: 50 }],
    pricePerUnit: 25,
    transportCosts: { 5: 10, 10: 15 },
    allowedShipmentSizes: [5, 10]
};

const mockCustomerDelayed: Customer = {
    id: 2,
    name: "Customer Delayed",
    description: "Delayed delivery customer",
    leadTime: 2, // 2-day delay
    totalRequirement: 80,
    deliverySchedule: [{ day: 6, requiredAmount: 40 }],
    pricePerUnit: 30,
    transportCosts: { 5: 15, 10: 20 },
    allowedShipmentSizes: [5, 10]
};

const mockLevelConfig: LevelConfig = {
    id: 0,
    name: "Test Level",
    description: "Test level for revenue calculation",
    initialCash: 5000,
    initialInventory: { patty: 10, bun: 10, cheese: 10, potato: 10, finishedGoods: 20 },
    daysToComplete: 10,
    productionCostPerUnit: 10,
    holdingCosts: { patty: 0.05, bun: 0.03, cheese: 0.04, potato: 0.02, finishedGoods: 0.1 },
    suppliers: [mockSupplier],
    customers: [mockCustomerImmediate, mockCustomerDelayed],
    maxScore: 1000,
    mapPositions: {
        mainFactory: { x: 50, y: 50 },
        suppliers: [{ x: 20, y: 30, id: 1 }],
        customers: [{ x: 80, y: 30, id: 1 }, { x: 80, y: 70, id: 2 }]
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
};

const initialGameState: GameState = {
    day: 1,
    cash: 5000,
    inventory: { patty: 10, bun: 10, cheese: 10, potato: 10, finishedGoods: 20 },
    inventoryValue: { patty: 50, bun: 30, cheese: 40, potato: 20, finishedGoods: 200 },
    pendingSupplierOrders: [],
    pendingCustomerOrders: [],
    customerDeliveries: {},
    supplierDeliveries: {},
    cumulativeProfit: 0,
    score: 100,
    history: [],
    gameOver: false,
    latenessPenalties: []
};

describe('Game Engine Revenue Calculation Issues', () => {
    it('should calculate revenue for all sales placed on the day (including delayed) - fixed behavior', () => {
        // Action with both immediate and delayed customer orders
        const gameAction: GameAction = {
            supplierOrders: [],
            production: 0,
            customerOrders: [
                { customerId: 1, quantity: 5 } as any, // Immediate customer (leadTime=0)
                { customerId: 2, quantity: 10 } as any // Delayed customer (leadTime=2)
            ]
        };

        const newState = processDay(initialGameState, gameAction, mockLevelConfig);
        const todaysHistory = newState.history[0];

        // Fixed behavior: ALL sales placed today count toward daily revenue
        const expectedTotalRevenue = (5 * 25 - 10) + (10 * 30 - 20); // 115 + 280 = 395 kr

        expect(todaysHistory.revenue).toBe(expectedTotalRevenue);

        // Day 1 Revenue check (fixed behavior)
        // Expected revenue includes both immediate and delayed sales
    });

    it('should show revenue correctly for days with only pending deliveries', () => {
        // Simulate the delayed customer order arriving after 2 days
        const gameStateWithPendingOrder: GameState = {
            ...initialGameState,
            day: 3, // 2 days later
            pendingCustomerOrders: [
                {
                    customerId: 2,
                    quantity: 10,
                    daysRemaining: 1, // Arriving today
                    totalRevenue: 10 * 30, // 10 units × 30 kr/unit = 300 kr
                    transportCost: 20, // Transport cost for 10 units
                    netRevenue: 10 * 30 - 20, // 300 - 20 = 280 kr
                    actualLeadTime: 2
                }
            ]
        };

        const gameAction: GameAction = {
            supplierOrders: [],
            production: 0,
            customerOrders: [] as any // No new orders today
        };

        const newState = processDay(gameStateWithPendingOrder, gameAction, mockLevelConfig);
        const todaysHistory = newState.history[0];

        // With the new system, revenue is recorded when orders are PLACED, not when delivered
        // So a day with no new orders but incoming deliveries should show 0 revenue
        // Day 3 Revenue check (no new orders placed)
        // Expected revenue (no new orders): 0

        // This should show 0 revenue since no new orders were placed today
        expect(todaysHistory.revenue).toBe(0);
    });

    it('demonstrates the fix: daily revenue now includes all orders placed that day', () => {
        // Test that shows the solution: revenue counted on day of order placement

        // Day 1: Place both immediate and delayed orders
        const day1Action: GameAction = {
            supplierOrders: [],
            production: 0,
            customerOrders: [
                { customerId: 1, quantity: 5 } as any, // Immediate: should count in day 1 revenue
                { customerId: 2, quantity: 10 } as any // Delayed: should ALSO count in day 1 revenue
            ]
        };

        const day1State = processDay(initialGameState, day1Action, mockLevelConfig);
        const day1Revenue = day1State.history[0].revenue;

        // Day 1 should now show ALL sales revenue (immediate + delayed)
        const expectedTotalRevenue = (5 * 25 - 10) + (10 * 30 - 20); // 115 + 280 = 395 kr
        expect(day1Revenue).toBe(expectedTotalRevenue);

        // The fix: Total order value placed on day 1 now equals recorded revenue
        const totalOrderValuePlaced = (5 * 25 - 10) + (10 * 30 - 20); // 395 kr
        const recordedRevenue = day1Revenue; // Should also be 395 kr

        // This demonstrates the fix: all revenue is counted on the day orders are placed
        expect(recordedRevenue).toBe(totalOrderValuePlaced);
        expect(totalOrderValuePlaced - recordedRevenue).toBe(0); // No missing revenue
    });

    it('confirms the revenue calculation fix is working correctly', () => {
        // This test confirms that the revenue calculation now works as intended

        const gameAction: GameAction = {
            supplierOrders: [],
            production: 0,
            customerOrders: [
                { customerId: 1, quantity: 5 } as any, // Immediate: 5 × 25 - 10 = 115 kr
                { customerId: 2, quantity: 10 } as any // Delayed: 10 × 30 - 20 = 280 kr
            ]
        };

        const newState = processDay(initialGameState, gameAction, mockLevelConfig);
        const actualRevenue = newState.history[0].revenue;

        // What the revenue should be (including all orders placed today)
        const expectedTotalRevenue = (5 * 25 - 10) + (10 * 30 - 20); // 115 + 280 = 395 kr

        // This test should now pass after fixing the engine
        expect(actualRevenue).toBe(expectedTotalRevenue);
        expect(expectedTotalRevenue).toBe(395); // Target behavior achieved
    });

    it('should handle zero revenue days correctly (no orders placed)', () => {
        const gameAction: GameAction = {
            supplierOrders: [],
            production: 5, // Produce goods but don't sell
            customerOrders: [] as any // No customer orders
        };

        const newState = processDay(initialGameState, gameAction, mockLevelConfig);
        const todaysHistory = newState.history[0];

        // With no customer orders, revenue should be exactly 0
        expect(todaysHistory.revenue).toBe(0);

        // This should never be null/undefined which would cause "N/A" display
        expect(todaysHistory.revenue).not.toBeNull();
        expect(todaysHistory.revenue).not.toBeUndefined();
        expect(typeof todaysHistory.revenue).toBe('number');
    });
});
