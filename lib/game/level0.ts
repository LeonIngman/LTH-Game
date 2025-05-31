import type { LevelConfig, DailyDemand } from "@/types/game"
import { createSuppliers } from "./suppliers"
import { baseLevelConfig } from "./level-base"

/**
 * Level 0 configuration - Introduction to basic logistics concepts
 */
export const level0Config: LevelConfig = {
  ...baseLevelConfig,
  id: 0,
  name: "The First Spark",
  description: "Learn the fundamentals of inventory management and supply chain",
  daysToComplete: 20,

  // Suppliers for Level 0 - with leadTime of 0 (instant delivery)
  suppliers: [
    {
      id: 1,
      name: "Pink Patty",
      leadTime: 0,
      capacityPerGame: { patty: 200, cheese: 100, bun: 150, potato: 0 },
      capacityPerDay: { patty: 20, cheese: 10, bun: 15, potato: 0 },
      materials: ["patty", "cheese", "bun", "potato"],
      shipmentPrices: {
        patty: { 50: 116, 100: 134, 200: 179 },
        cheese: { 50: 65, 100: 89, 200: 116 },
        bun: { 50: 89, 100: 98, 200: 134 },
      },
      shipmentPricesIncludeBaseCost: false,
    },
    {
      id: 2,
      name: "Brown Sauce",
      leadTime: 0,
      capacityPerGame: { patty: 150, cheese: 200, bun: 100, potato: 50 },
      capacityPerDay: { patty: 15, cheese: 20, bun: 10, potato: 5 },
      materials: ["patty", "cheese", "bun", "potato"],
      shipmentPrices: {
        patty: { 50: 120, 100: 140, 200: 185 },
        cheese: { 50: 70, 100: 95, 200: 120 },
        bun: { 50: 90, 100: 100, 200: 140 },
      },
      shipmentPricesIncludeBaseCost: false,
    },
    {
      id: 3,
      name: "Firehouse Foods",
      leadTime: 0,
      capacityPerGame: { patty: 100, cheese: 100, bun: 200, potato: 100 },
      capacityPerDay: { patty: 10, cheese: 10, bun: 20, potato: 10 },
      materials: ["patty", "cheese", "bun", "potato"],
      shipmentPrices: {
        patty: { 50: 125, 100: 145, 200: 190 },
        cheese: { 50: 75, 100: 100, 200: 125 },
        bun: { 50: 92, 100: 102, 200: 142 },
      },
      shipmentPricesIncludeBaseCost: false,
    },
  ],

  // Delivery options for Level 0 - only instant delivery
  deliveryOptions: [
    {
      id: 1,
      name: "Instant Delivery",
      leadTime: 0, // No lead time - immediate delivery
      costMultiplier: 1.0,
      description: "Immediate delivery with no waiting time",
    },
  ],

  // Customers for Level 0 - with custom delivery schedules
  customers: [
    {
      id: 1,
      name: "Yummy Zone",
      description: "A local restaurant chain with specific delivery requirements.",
      leadTime: 0, // No lead time for order processing
      totalRequirement: 80, // Total units required
      deliverySchedule: [
        {
          day: 3,
          requiredAmount: 20,
        },
        {
          day: 20, // Final delivery on the last day
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
      leadTime: 0, // No lead time for order processing
      totalRequirement: 120, // Total units required
      deliverySchedule: [
        {
          day: 6,
          requiredAmount: 40,
        },
        {
          day: 20, // Final delivery on the last day
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
      leadTime: 0, // No lead time for order processing
      totalRequirement: 100, // Total units required
      deliverySchedule: [
        {
          day: 8,
          requiredAmount: 60,
        },
        {
          day: 20, // Final delivery on the last day
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

  // Demand model for Level 0 - relatively stable demand
  demandModel: (day: number): DailyDemand => {
    // Base demand between 8-12 units
    const baseDemand = 10

    // Small random variation (+/- 2 units)
    const variation = Math.floor(Math.random() * 5) - 2

    // Weekly cycle - higher demand on days 1, 8, 15
    const weeklyBoost = day % 7 === 1 ? 5 : 0

    // Calculate final demand
    const quantity = Math.max(0, baseDemand + variation + weeklyBoost)

    // Fixed price for Level 0
    const pricePerUnit = 30

    return { quantity, pricePerUnit }
  },

  // Updated production cost per unit from 5 to 4
  productionCostPerUnit: 4,

  // Updated map positions for Level 0 with exact coordinates provided
  mapPositions: {
    0: {
      mainFactory: { x: 515, y: 432 },
      suppliers: {
        1: { x: 61, y: 470, name: "Pink Patty" },
        2: { x: 349, y: 259, name: "Brown Sauce" },
        3: { x: 283, y: 635, name: "Firehouse Foods" },
      },
      restaurants: [
        { x: 657, y: 625, name: "Yummy Zone", customerId: 1 },
        { x: 760, y: 175, name: "Toast-to-go", customerId: 2 },
        { x: 761, y: 417, name: "StudyFuel", customerId: 3 },
      ],
    },
  },
}
