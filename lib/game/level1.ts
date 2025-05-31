import type { LevelConfig, DailyDemand } from "@/types/game"
import { createSuppliers } from "./suppliers"
import { baseLevelConfig } from "./level-base"

/**
 * Level 1 configuration - Timing is Everything
 */
export const level1Config: LevelConfig = {
  ...baseLevelConfig,
  id: 1,
  name: "Timing is Everything",
  description: "Manage your burger restaurant supply chain with a fixed 2-day delivery time",
  daysToComplete: 30, // Changed from 20 to 30

  // Suppliers for Level 1 - with leadTime of 2 days
  suppliers: createSuppliers([2, 2, 2]),

  // Single delivery option with constant 2-day lead time
  deliveryOptions: [
    {
      id: 1,
      name: "Standard Delivery",
      leadTime: 2,
      costMultiplier: 1.0,
      description: "Standard delivery (2 days)",
    },
  ],

  // Customers for Level 1 - with dynamically generated delivery schedules
  customers: [
    {
      id: 1,
      name: "Yummy Zone",
      description: "A local restaurant chain with specific delivery requirements.",
      leadTime: 1, // 1-day lead time for order processing
      totalRequirement: 80, // Updated total requirement
      deliverySchedule: [
        {
          day: 3,
          requiredAmount: 20,
        },
        {
          day: 30, // Final delivery on the last day
          requiredAmount: 60, // Remaining amount
        },
      ],
      pricePerUnit: 49,
      transportCosts: {
        20: 134,
        40: 179,
        100: 204,
      },
      allowedShipmentSizes: [20, 40, 100],
      minimumDeliveryAmount: 20,
      active: true,
    },
    {
      id: 2,
      name: "Toast-to-go",
      description: "A quick-service restaurant requiring regular deliveries.",
      leadTime: 1, // 1-day lead time for order processing
      totalRequirement: 120, // Updated total requirement
      deliverySchedule: [
        {
          day: 6,
          requiredAmount: 40,
        },
        {
          day: 30, // Final delivery on the last day
          requiredAmount: 80, // Remaining amount
        },
      ],
      pricePerUnit: 46,
      transportCosts: {
        20: 139,
        40: 186,
        100: 213,
      },
      allowedShipmentSizes: [20, 40, 100],
      minimumDeliveryAmount: 20,
      active: true,
    },
    {
      id: 3,
      name: "StudyFuel",
      description: "A campus food service catering to university students.",
      leadTime: 1, // 1-day lead time for order processing
      totalRequirement: 100, // Updated total requirement
      deliverySchedule: [
        {
          day: 8,
          requiredAmount: 60,
        },
        {
          day: 30, // Final delivery on the last day
          requiredAmount: 40, // Remaining amount
        },
      ],
      pricePerUnit: 47,
      transportCosts: {
        20: 145,
        40: 194,
        100: 222,
      },
      allowedShipmentSizes: [20, 40, 100],
      minimumDeliveryAmount: 20,
      active: true,
    },
  ],

  // Demand model for Level 1 - more variable demand
  demandModel: (day: number): DailyDemand => {
    // Base demand between 10-15 units
    const baseDemand = 12

    // Larger random variation (+/- 4 units)
    const variation = Math.floor(Math.random() * 9) - 4

    // Weekly cycle - higher demand on days 1-2, 8-9, 15-16, etc.
    const weeklyBoost = day % 7 === 1 || day % 7 === 2 ? 8 : 0

    // Seasonal trend - increasing demand over time
    const seasonalTrend = Math.floor(day / 10)

    // Calculate final demand
    const quantity = Math.max(0, baseDemand + variation + weeklyBoost + seasonalTrend)

    // Variable price for Level 1 - price fluctuates slightly
    const basePrice = 40
    const priceVariation = Math.floor(Math.random() * 5) - 2
    const pricePerUnit = basePrice + priceVariation

    return { quantity, pricePerUnit }
  },

  // Updated production cost per unit from 5 to 4
  productionCostPerUnit: 4,

  // Add map positions
  mapPositions: {
    1: {
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
  },
}

// Make sure level1Config doesn't override initialInventory
// If it does, remove that override to use the baseLevelConfig values
if (level1Config.initialInventory) {
  delete level1Config.initialInventory
}
