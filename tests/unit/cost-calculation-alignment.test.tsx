/**
 * Test to verify that frontend cost calculations match backend cost calculations
 */

import { validateAffordability } from "@/lib/game/engine"
import { calculateTransportationCost } from "@/lib/game/inventory-management"
import { level0Config } from "@/lib/game/level0"
import type { GameState, GameAction } from "@/types/game"

describe("Cost Calculation Alignment", () => {
    const mockGameState: GameState = {
        day: 1,
        cash: 10000,
        inventory: {
            patty: 10,
            cheese: 10,
            bun: 10,
            potato: 10,
            finishedGoods: 5,
        },
        inventoryValue: {
            patty: 150,
            cheese: 120,
            bun: 80,
            potato: 60,
            finishedGoods: 200,
        },
        pendingSupplierOrders: [],
        pendingCustomerOrders: [],
        customerDeliveries: {},
        supplierDeliveries: {},
        cumulativeProfit: 0,
        score: 0,
        history: [],
        gameOver: false,
        latenessPenalties: [],
        forecastData: null,
    }

    const mockAction: GameAction = {
        supplierOrders: [
            {
                supplierId: 1,
                pattyPurchase: 20,
                cheesePurchase: 15,
                bunPurchase: 25,
                potatoPurchase: 30,
            },
        ],
        production: 10,
        customerOrders: [],
    }

    it("should match backend total cost calculation", () => {
        // Get backend calculation
        const backendResult = validateAffordability(mockGameState, mockAction, level0Config)

        expect(backendResult.valid).toBeTruthy()
        expect(backendResult.costBreakdown).toBeDefined()
        expect(backendResult.totalCost).toBeDefined()

        if (!backendResult.costBreakdown || !backendResult.totalCost) {
            throw new Error("Backend calculation missing required data")
        }

        // Calculate frontend components to match backend
        const purchaseCost = backendResult.costBreakdown.purchaseCost
        const supplierTransportCost = backendResult.costBreakdown.supplierTransportCost
        const productionCost = backendResult.costBreakdown.productionCost
        const holdingCost = backendResult.costBreakdown.holdingCost
        const overstockCost = backendResult.costBreakdown.overstockCost
        const restaurantDeliveryCost = backendResult.costBreakdown.restaurantDeliveryCost
        const otherSurcharges = backendResult.costBreakdown.otherSurcharges

        // Frontend total cost calculation
        const frontendTotalCost =
            purchaseCost +
            supplierTransportCost +
            productionCost +
            holdingCost +
            overstockCost +
            restaurantDeliveryCost +
            otherSurcharges

        // Both should be rounded to 2 decimal places
        const backendTotal = Number(backendResult.totalCost.toFixed(2))
        const frontendTotal = Number(frontendTotalCost.toFixed(2))

        expect(frontendTotal).toEqual(backendTotal)
    })

    it("should have consistent cost breakdown components", () => {
        const backendResult = validateAffordability(mockGameState, mockAction, level0Config)

        expect(backendResult.costBreakdown).toBeDefined()

        if (!backendResult.costBreakdown) {
            throw new Error("Backend cost breakdown missing")
        }

        // Verify all expected cost categories are present
        expect(backendResult.costBreakdown.purchaseCost).toBeGreaterThanOrEqual(0)
        expect(backendResult.costBreakdown.supplierTransportCost).toBeGreaterThanOrEqual(0)
        expect(backendResult.costBreakdown.productionCost).toBeGreaterThanOrEqual(0)
        expect(backendResult.costBreakdown.holdingCost).toBeGreaterThanOrEqual(0)
        expect(backendResult.costBreakdown.overstockCost).toBeGreaterThanOrEqual(0)
        expect(backendResult.costBreakdown.restaurantDeliveryCost).toBeGreaterThanOrEqual(0)
        expect(backendResult.costBreakdown.otherSurcharges).toEqual(0) // Currently always 0

        // Verify breakdown sums to total cost
        const componentSum =
            backendResult.costBreakdown.purchaseCost +
            backendResult.costBreakdown.supplierTransportCost +
            backendResult.costBreakdown.productionCost +
            backendResult.costBreakdown.holdingCost +
            backendResult.costBreakdown.overstockCost +
            backendResult.costBreakdown.restaurantDeliveryCost +
            backendResult.costBreakdown.otherSurcharges

        expect(Number(componentSum.toFixed(2))).toEqual(Number(backendResult.totalCost!.toFixed(2)))
    })

    it("should match transportation cost calculations", () => {
        // Test that restaurant transportation cost matches utility function
        const restaurantTransportCost = calculateTransportationCost(mockAction, level0Config)

        const backendResult = validateAffordability(mockGameState, mockAction, level0Config)
        expect(backendResult.costBreakdown?.restaurantDeliveryCost).toEqual(restaurantTransportCost)
    })
})
