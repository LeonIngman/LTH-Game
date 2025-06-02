import type { LevelConfig, DailyDemand } from "@/types/game"

/**
 * Level 3 configuration - Uncertainty Unleashed
 * All config is now self-contained, no baseLevelConfig import needed.
 */
export const level3Config: LevelConfig = {
  id: 3,
  name: "Uncertainty Unleashed",
  description: "Navigate complex supply chains with variable market conditions.",
  daysToComplete: 30,
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
  maxScore: 1400,

  suppliers: [
    {
      id: 1,
      name: "Pink Patty",
      leadTime: 0,
      capacityPerGame: { patty: 150, cheese: 500, bun: 200, potato: 0 },
      materials: ["patty", "cheese", "bun", "potato"],
      materialPrices: {
        patty: 10,
        cheese: 5,
        bun: 3,
        potato: 2,
      },
      shipmentPrices: {
        patty: { 50: 116, 100: 134},
        bun: { 50: 89, 100: 98, 200: 134 },
        cheese: { 50: 65, 100: 89, 200: 116 },
        potato: { 50: 98, 100: 134, 200: 134 },
      },
      shipmentPricesIncludeBaseCost: false,
    },
    {
      id: 2,
      name: "Brown Sauce",
      leadTime: 0,
      capacityPerGame: { patty: 200, cheese: 0, bun: 200, potato: 850 },
      materials: ["patty", "cheese", "bun", "potato"],
      materialPrices: {
        patty: 10,
        cheese: 5,
        bun: 3,
        potato: 2,
      },
      shipmentPrices: {
        patty: { 50: 121, 100: 139, 200: 186 },
        bun: { 50: 92, 100: 102, 200: 139 },
        cheese: { 50: 68, 100: 92, 200: 121 },
        potato: { 50: 102, 100: 139, 200: 139 },
      },
      shipmentPricesIncludeBaseCost: false,
    },
    {
      id: 3,
      name: "Firehouse Foods",
      leadTime: 0,
      capacityPerGame: { patty: 0, cheese: 500, bun: 250, potato: 700 },
      materials: ["patty", "cheese", "bun", "potato"],
      materialPrices: {
        patty: 10,
        cheese: 5,
        bun: 3,
        potato: 2,
      },
      shipmentPrices: {
        patty: { 50: 126, 100: 145, 150: 175 },
        bun: { 50: 96, 100: 106, 150: 126 },
        cheese: { 50: 71, 100: 96, 150: 106 },
        potato: { 50: 106, 100: 145, 150: 145 },
      },
      shipmentPricesIncludeBaseCost: false,
    },
  ],

  deliveryOptions: [
    {
      id: 1,
      name: "Standard Delivery",
      leadTime: 2,
      costMultiplier: 1.0,
      description: "Standard delivery (2 days)",
    },
  ],

  customers: [
    {
      id: 1,
      name: "Yummy Zone",
      description: "A local restaurant chain with specific delivery requirements.",
      leadTime: 1,
      totalRequirement: 80,
      deliverySchedule: [
        { day: 3, requiredAmount: 20 },
        { day: 11, requiredAmount: 60 },
        { day: 20, requiredAmount: 6800 },
      ],
      pricePerUnit: 49,
      transportCosts: { 20: 134, 40: 179, 100: 204 },
      allowedShipmentSizes: [20, 40, 100],
      minimumDeliveryAmount: 20,
      active: true,
    },
    {
      id: 2,
      name: "Toast-to-go",
      description: "A quick-service restaurant requiring regular deliveries.",
      leadTime: 1,
      totalRequirement: 120,
      deliverySchedule: [
        { day: 6, requiredAmount: 40 },
        { day: 20, requiredAmount: 120 },
      ],
      pricePerUnit: 46,
      transportCosts: { 20: 139, 40: 186, 100: 213 },
      allowedShipmentSizes: [20, 40, 100],
      minimumDeliveryAmount: 20,
      active: true,
    },
    {
      id: 3,
      name: "StudyFuel",
      description: "A campus food service catering to university students.",
      leadTime: 1,
      totalRequirement: 100,
      deliverySchedule: [
        { day: 8, requiredAmount: 60 },
        { day: 12, requiredAmount: 100 },
        { day: 20, requiredAmount: 100 },
      ],
      pricePerUnit: 47,
      transportCosts: { 20: 145, 40: 194, 100: 222 },
      allowedShipmentSizes: [20, 40, 100],
      minimumDeliveryAmount: 20,
      active: true,
    },
  ],

  demandModel: (day: number): DailyDemand => {
    const baseDemand = 12
    const variation = Math.floor(Math.random() * 9) - 4
    const weeklyBoost = day % 7 === 1 || day % 7 === 2 ? 8 : 0
    const seasonalTrend = Math.floor(day / 10)
    const quantity = Math.max(0, baseDemand + variation + weeklyBoost + seasonalTrend)
    const basePrice = 40
    const priceVariation = Math.floor(Math.random() * 5) - 2
    const pricePerUnit = basePrice + priceVariation
    return { quantity, pricePerUnit }
  },

  overstock: {
    patty: { threshold: 100, penaltyPerUnit: 2 },
    bun: { threshold: Infinity, penaltyPerUnit: 1 },
    cheese: { threshold: 250, penaltyPerUnit: 1 },
    potato: { threshold: 300, penaltyPerUnit: 0.5 },
    finishedGoods: { threshold: 50, penaltyPerUnit: 3 },
  },
  safetystock: {
    patty: { threshold: 20},
    bun: { threshold: 40},
    cheese: { threshold: 60},
    potato: { threshold: 80},
  },

  mapPositions: {
    3: {
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
