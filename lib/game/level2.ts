import type { LevelConfig, DailyDemand } from "@/types/game"

/**
 * Level 2 configuration - Advanced Supply Chain
 * All config is now self-contained, no baseLevelConfig import needed.
 */
export const level2Config: LevelConfig = {
  id: 2,
  name: "Advanced Supply Chain",
  description: "Manage your restaurant with multiple suppliers, longer lead times, and more demand variation.",
  daysToComplete: 40,
  initialCash: 10000,
  initialInventory: {
    patty: 100,
    cheese: 250,
    bun: 150,
    potato: 300,
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
  productionCostPerUnit: 4,
  maxScore: 1500,

  // Suppliers for Level 2 - longer lead times, more variety
  suppliers: [
    {
      id: 1,
      name: "Pink Patty",
      leadTime: 3,
      capacityPerGame: { patty: 250, cheese: 120, bun: 180, potato: 0 },
      capacityPerDay: { patty: 25, cheese: 12, bun: 18, potato: 0 },
      materials: ["patty", "cheese", "bun", "potato"],
      shipmentPrices: {
        patty: { 50: 120, 100: 140, 200: 185 },
        cheese: { 50: 70, 100: 95, 200: 120 },
        bun: { 50: 90, 100: 100, 200: 140 },
      },
      shipmentPricesIncludeBaseCost: false,
    },
    {
      id: 2,
      name: "Brown Sauce",
      leadTime: 4,
      capacityPerGame: { patty: 180, cheese: 250, bun: 120, potato: 80 },
      capacityPerDay: { patty: 18, cheese: 25, bun: 12, potato: 8 },
      materials: ["patty", "cheese", "bun", "potato"],
      shipmentPrices: {
        patty: { 50: 125, 100: 145, 200: 190 },
        cheese: { 50: 75, 100: 100, 200: 125 },
        bun: { 50: 92, 100: 102, 200: 142 },
      },
      shipmentPricesIncludeBaseCost: false,
    },
    {
      id: 3,
      name: "Firehouse Foods",
      leadTime: 2,
      capacityPerGame: { patty: 120, cheese: 120, bun: 220, potato: 120 },
      capacityPerDay: { patty: 12, cheese: 12, bun: 22, potato: 12 },
      materials: ["patty", "cheese", "bun", "potato"],
      shipmentPrices: {
        patty: { 50: 130, 100: 150, 200: 195 },
        cheese: { 50: 80, 100: 105, 200: 130 },
        bun: { 50: 95, 100: 105, 200: 145 },
      },
      shipmentPricesIncludeBaseCost: false,
    },
  ],

  // Delivery options for Level 2
  deliveryOptions: [
    {
      id: 1,
      name: "Standard Delivery",
      leadTime: 3,
      costMultiplier: 1.0,
      description: "Standard delivery (3 days)",
    },
    {
      id: 2,
      name: "Express Delivery",
      leadTime: 1,
      costMultiplier: 1.3,
      description: "Faster delivery at a higher cost (1 day)",
    },
  ],

  // Customers for Level 2 - more requirements, longer schedule
  customers: [
    {
      id: 1,
      name: "Yummy Zone",
      description: "A local restaurant chain with specific delivery requirements.",
      leadTime: 2,
      totalRequirement: 120,
      deliverySchedule: [
        { day: 5, requiredAmount: 30 },
        { day: 20, requiredAmount: 40 },
        { day: 40, requiredAmount: 50 },
      ],
      pricePerUnit: 50,
      transportCosts: { 20: 140, 40: 185, 100: 210 },
      allowedShipmentSizes: [20, 40, 100],
      minimumDeliveryAmount: 20,
      active: true,
    },
    {
      id: 2,
      name: "Toast-to-go",
      description: "A quick-service restaurant requiring regular deliveries.",
      leadTime: 2,
      totalRequirement: 160,
      deliverySchedule: [
        { day: 10, requiredAmount: 60 },
        { day: 25, requiredAmount: 50 },
        { day: 40, requiredAmount: 50 },
      ],
      pricePerUnit: 47,
      transportCosts: { 20: 145, 40: 192, 100: 220 },
      allowedShipmentSizes: [20, 40, 100],
      minimumDeliveryAmount: 20,
      active: true,
    },
    {
      id: 3,
      name: "StudyFuel",
      description: "A campus food service catering to university students.",
      leadTime: 2,
      totalRequirement: 140,
      deliverySchedule: [
        { day: 15, requiredAmount: 70 },
        { day: 40, requiredAmount: 70 },
      ],
      pricePerUnit: 48,
      transportCosts: { 20: 150, 40: 200, 100: 225 },
      allowedShipmentSizes: [20, 40, 100],
      minimumDeliveryAmount: 20,
      active: true,
    },
  ],

  // Demand model for Level 2 - even more variable demand
  demandModel: (day: number): DailyDemand => {
    const baseDemand = 15
    const variation = Math.floor(Math.random() * 13) - 6
    const weeklyBoost = day % 7 === 1 || day % 7 === 2 ? 10 : 0
    const seasonalTrend = Math.floor(day / 10) * 2
    const quantity = Math.max(0, baseDemand + variation + weeklyBoost + seasonalTrend)
    const basePrice = 38
    const priceVariation = Math.floor(Math.random() * 7) - 3
    const pricePerUnit = basePrice + priceVariation
    return { quantity, pricePerUnit }
  },

  overstock: {
    patty: { threshold: 200, penaltyPerUnit: 2 },
    bun: { threshold: 300, penaltyPerUnit: 1 },
    cheese: { threshold: 400, penaltyPerUnit: 1 },
    potato: { threshold: 500, penaltyPerUnit: 0.5 },
    finishedGoods: { threshold: 100, penaltyPerUnit: 3 },
  },

  // Map positions for Level 2
  mapPositions: {
    2: {
      mainFactory: { x: 400, y: 500 },
      suppliers: {
        1: { x: 80, y: 300, name: "Pink Patty" },
        2: { x: 500, y: 100, name: "Brown Sauce" },
        3: { x: 950, y: 350, name: "Firehouse Foods" },
      },
      restaurants: [
        { x: 600, y: 800, name: "Yummy Zone", customerId: 1 },
        { x: 800, y: 150, name: "Toast-to-go", customerId: 2 },
        { x: 100, y: 650, name: "StudyFuel", customerId: 3 },
      ],
    },
  },
}
