import type { LevelConfig } from "@/types/game"

/**
 * Base level configuration with common settings
 */
export const baseLevelConfig: LevelConfig = {
  id: 0,
  name: "Base Level",
  description: "Base level configuration",
  daysToComplete: 20,
  initialCash: 10000,
  initialInventory: {
    patty: 100, // Updated from default value
    cheese: 250, // Updated from default value
    bun: 150, // Updated from default value
    potato: 300, // Updated from default value
    finishedGoods: 0,
  },
  materialBasePrices: {
    patty: 10,
    cheese: 5,
    bun: 3,
    potato: 2,
  },
  holdingCosts: {
    patty: 1.0,
    cheese: 0.5,
    bun: 0.3,
    potato: 0.2,
    finishedGoods: 2.0,
  },
  productionCostPerUnit: 4, // Updated from 5 to 4
  maxScore: 1000,
  suppliers: [],
  deliveryOptions: [],
  customers: [],
  demandModel: () => ({ quantity: 0, pricePerUnit: 0 }),
}
