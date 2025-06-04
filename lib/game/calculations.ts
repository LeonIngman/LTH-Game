
import type { Inventory, LevelConfig } from "@/types/game"
import { HOLDING_COSTS } from "../constants"

export function calculateHoldingCost(inventory: Inventory, levelConfig: LevelConfig): number {
  // Use HOLDING_COSTS from constants
  const holdingCosts = {
    patty: HOLDING_COSTS.PATTY,
    bun: HOLDING_COSTS.BUN,
    cheese: HOLDING_COSTS.CHEESE,
    potato: HOLDING_COSTS.POTATO,
  }

  // Calculate holding cost for each material type
  // Apply 25% annual rate converted to daily (divide by 365)
  const annualRate = 0.25
  const daysInYear = 365

  const pattyCost = (inventory.patty * holdingCosts.patty * annualRate) / daysInYear
  const bunCost = (inventory.bun * holdingCosts.bun * annualRate) / daysInYear
  const cheeseCost = (inventory.cheese * holdingCosts.cheese * annualRate) / daysInYear
  const potatoCost = (inventory.potato * holdingCosts.potato * annualRate) / daysInYear

  // Sum up all costs
  return pattyCost + bunCost + cheeseCost + potatoCost
}

/**
 * Get breakdown of holding costs by material type
 */
export function getHoldingCostBreakdown(inventory: Inventory, levelConfig: LevelConfig): Record<string, number> {
  // Use HOLDING_COSTS from constants
  const holdingCosts = {
    patty: HOLDING_COSTS.PATTY,
    bun: HOLDING_COSTS.BUN,
    cheese: HOLDING_COSTS.CHEESE,
    potato: HOLDING_COSTS.POTATO,
  }

  // Apply 25% annual rate converted to daily (divide by 365)
  const annualRate = 0.25
  const daysInYear = 365

  return {
    patty: (inventory.patty * holdingCosts.patty * annualRate) / daysInYear,
    bun: (inventory.bun * holdingCosts.bun * annualRate) / daysInYear,
    cheese: (inventory.cheese * holdingCosts.cheese * annualRate) / daysInYear,
    potato: (inventory.potato * holdingCosts.potato * annualRate) / daysInYear,
  }
}
