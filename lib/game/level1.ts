import type { LevelConfig } from "@/types/game"

/**
 * Level 1 configuration - Timing is Everything
 * All config is now self-contained, no baseLevelConfig import needed.
 */
export const level1Config: LevelConfig = {
  id: 1,
  name: "Timing is Everything",
  description: "Manage your burger restaurant supply chain with a fixed 2-day delivery time",
  daysToComplete: 20,
  initialCash: 2500,
  initialInventory: {
    patty: 100,
    cheese: 250,
    bun: 150,
    potato: 300,
    finishedGoods: 0,
  },
  holdingCosts: {
    patty: 1.0,
    cheese: 0.5,
    bun: 0.3,
    potato: 0.2,
    finishedGoods: 2.0,
  },
  productionCostPerUnit: 4,
  maxScore: 1200,

  // Suppliers for Level 1 - with leadTime of 2 days
  suppliers: [
    {
      id: 1,
      name: "Pink Patty",
      leadTime: 1,
      capacityPerGame: { patty: 150, cheese: 500, bun: 200, potato: 0 },
      materials: ["patty", "cheese", "bun", "potato"],
      materialPrices: {
        patty: 10,
        cheese: 1.5,
        bun: 3,
        potato: 0,
      },
      shipmentPrices: {
        patty: { 50: 116, 100: 134},
        bun: { 50: 89, 100: 98, 200: 134 },
        cheese: { 50: 65, 100: 89, 200: 116 },
        potato: { 50: 98, 100: 134, 200: 134 },
      },
    },
    {
      id: 2,
      name: "Brown Sauce",
      leadTime: 2,
      capacityPerGame: { patty: 200, cheese: 0, bun: 200, potato: 850 },
      materials: ["patty", "cheese", "bun", "potato"],
      materialPrices: {
        patty: 13,
        cheese: 0,
        bun: 2.7,
        potato: 1.6,
      },
      shipmentPrices: {
        patty: { 50: 121, 100: 139, 200: 186 },
        bun: { 50: 92, 100: 102, 200: 139 },
        cheese: { 50: 68, 100: 92, 200: 121 },
        potato: { 50: 102, 100: 139, 200: 139 },
      },
    },
    {
      id: 3,
      name: "Firehouse Foods",
      leadTime: 3,
      capacityPerGame: { patty: 0, cheese: 500, bun: 250, potato: 700 },
      materials: ["patty", "cheese", "bun", "potato"],
      materialPrices: {
        patty: 0,
        cheese: 1.8,
        bun: 3.4,
        potato: 1.2,
      },
      shipmentPrices: {
        patty: { 50: 126, 100: 145, 150: 175 },
        bun: { 50: 96, 100: 106, 150: 126 },
        cheese: { 50: 71, 100: 96, 150: 106 },
        potato: { 50: 106, 100: 145, 150: 145 },
      },
    },
  ],

  // Customers for Level 1 - with dynamically generated delivery schedules
  customers: [
    {
      id: 1,
      name: "Yummy Zone",
      description: "A local restaurant chain with specific delivery requirements.",
      leadTime: 2,
      totalRequirement: 80,
      deliverySchedule: [
        { day: 3, requiredAmount: 20 },
        { day: 30, requiredAmount: 60 },
      ],
      pricePerUnit: 49,
      transportCosts: { 20: 134, 40: 179, 100: 204 },
      allowedShipmentSizes: [20, 40, 100],
    },
    {
      id: 2,
      name: "Toast-to-go",
      description: "A quick-service restaurant requiring regular deliveries.",
      leadTime: 3,
      totalRequirement: 120,
      deliverySchedule: [
        { day: 6, requiredAmount: 40 },
        { day: 30, requiredAmount: 80 },
      ],
      pricePerUnit: 46,
      transportCosts: { 20: 139, 40: 186, 100: 213 },
      allowedShipmentSizes: [20, 40, 100],
    },
    {
      id: 3,
      name: "StudyFuel",
      description: "A campus food service catering to university students.",
      leadTime: 1,
      totalRequirement: 100,
      deliverySchedule: [
        { day: 8, requiredAmount: 60 },
        { day: 30, requiredAmount: 40 },
      ],
      pricePerUnit: 47,
      transportCosts: { 20: 145, 40: 194, 100: 222 },
      allowedShipmentSizes: [20, 40, 100],
    },
  ],

  overstock: {
    patty: { threshold: 100, penaltyPerUnit: 2 },
    bun: { threshold: Infinity, penaltyPerUnit: 1 },
    cheese: { threshold: 250, penaltyPerUnit: 1 },
    potato: { threshold: 300, penaltyPerUnit: 0.5 },
    finishedGoods: { threshold: 50, penaltyPerUnit: 3 },
  },
  safetystock: {
    patty: { threshold: 0},
    bun: { threshold: 0},
    cheese: { threshold: 0},
    potato: { threshold: 0},
  },

  // Keep original map positions for Level 1
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
