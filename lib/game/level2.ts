import type { LevelConfig, MapPositions } from "@/types/game"

// Define map positions for Level 2 - using same coordinates as Level 1
const level2MapPositions: MapPositions = {
  2: {
    mainFactory: { x: 210, y: 495 },
    suppliers: {
      1: { x: 30, y: 360, name: "Pink Patty" },
      2: { x: 460, y: 150, name: "Brown Sauce" },
      3: { x: 970, y: 325, name: "Firehouse Foods" },
    },
    restaurants: [
      { x: 590, y: 750, name: "Yummy Zone", customerId: 1 },
      { x: 795, y: 125, name: "Toast-to-go", customerId: 2 },
      { x: 55, y: 610, name: "StudyFuel", customerId: 3 },
    ],
  },
}

/**
 * Level 2 configuration - Forecast the Future
 */
export const level2Config: LevelConfig = {
  id: 2,
  name: "Forecast the Future",
  description: "Learn to forecast demand and plan your supply chain accordingly.",
  daysToComplete: 30,
  startingCash: 5000,
  productionCapacity: 100,
  productionCostPerUnit: 5,
  holdingCostPerUnit: 0.5,
  sellingPricePerUnit: 25,

  // Ensure suppliers array exists
  suppliers: [
    {
      id: 1,
      name: "Pink Patty",
      leadTime: 2,
      capacityPerDay: 100,
      materialBasePrices: {
        patty: 5,
        cheese: 3,
        bun: 2,
        potato: 1,
      },
    },
    {
      id: 2,
      name: "Brown Sauce",
      leadTime: 1,
      capacityPerDay: 80,
      materialBasePrices: {
        patty: 6,
        cheese: 4,
        bun: 3,
        potato: 1.5,
      },
    },
    {
      id: 3,
      name: "Firehouse Foods",
      leadTime: 3,
      capacityPerDay: 150,
      materialBasePrices: {
        patty: 4,
        cheese: 2.5,
        bun: 1.5,
        potato: 0.8,
      },
    },
  ],

  // Ensure customers array exists
  customers: [
    {
      id: 1,
      name: "Yummy Zone",
      leadTime: 1,
      pricePerUnit: 28,
      transportCost: 2,
    },
    {
      id: 2,
      name: "Toast-to-go",
      leadTime: 2,
      pricePerUnit: 30,
      transportCost: 3,
    },
    {
      id: 3,
      name: "StudyFuel",
      leadTime: 3,
      pricePerUnit: 32,
      transportCost: 4,
    },
  ],

  // Add map positions
  mapPositions: level2MapPositions,

  // Add demand model
  demandModel: (day) => {
    // Simple demand model with some variability
    const baseQuantity = 50
    const variation = Math.sin(day * 0.2) * 20 // Sinusoidal variation
    const randomFactor = Math.random() * 10 - 5 // Random noise between -5 and 5

    return {
      quantity: Math.max(10, Math.round(baseQuantity + variation + randomFactor)),
      pricePerUnit: 30,
    }
  },

  // Add other necessary properties
  materialBasePrices: {
    patty: 5,
    cheese: 3,
    bun: 2,
    potato: 1,
  },

  deliveryOptions: [
    { id: 1, name: "Standard", costMultiplier: 1.0, leadTimeModifier: 0 },
    { id: 2, name: "Express", costMultiplier: 1.5, leadTimeModifier: -1 },
  ],
}
