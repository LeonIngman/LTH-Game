import { calculateHoldingCost, getHoldingCostBreakdown } from "./calculations"
import { HOLDING_COSTS } from "@/lib/constants"

describe("Game Calculations", () => {
  describe("calculateHoldingCost", () => {
    it("should calculate holding cost correctly for empty inventory", () => {
      const inventory = { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 }
      expect(calculateHoldingCost(inventory)).toBe(0)
    })

    it("should calculate holding cost correctly for non-empty inventory", () => {
      const inventory = { patty: 10, bun: 20, cheese: 30, potato: 40, finishedGoods: 0 }
      const expectedCost =
        10 * HOLDING_COSTS.PATTY + 20 * HOLDING_COSTS.BUN + 30 * HOLDING_COSTS.CHEESE + 40 * HOLDING_COSTS.POTATO

      expect(calculateHoldingCost(inventory)).toBe(expectedCost)
    })
  })

  describe("getHoldingCostBreakdown", () => {
    it("should return correct breakdown for non-empty inventory", () => {
      const inventory = { patty: 10, bun: 20, cheese: 30, potato: 40, finishedGoods: 0 }
      const breakdown = getHoldingCostBreakdown(inventory)

      expect(breakdown.patty).toBe(10 * HOLDING_COSTS.PATTY)
      expect(breakdown.bun).toBe(20 * HOLDING_COSTS.BUN)
      expect(breakdown.cheese).toBe(30 * HOLDING_COSTS.CHEESE)
      expect(breakdown.potato).toBe(40 * HOLDING_COSTS.POTATO)
    })
  })
})
