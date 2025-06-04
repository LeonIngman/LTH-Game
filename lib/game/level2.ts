import type { LevelConfig } from "@/types/game"

/**
 * Level 2 configuration - Advanced Supply Chain
 * All config is now self-contained, no baseLevelConfig import needed.
 */
export const level2Config: LevelConfig = {
  id: 2,
  name: "Advanced Supply Chain",
  description: "Manage your restaurant with multiple suppliers, longer lead times, and more demand variation.",
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
  maxScore: 1500,

  // Suppliers for Level 2 - longer lead times, more variety
  suppliers: [
    {
      id: 1,
      name: "Pink Patty",
      leadTime: 0,
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
      leadTime: 0,
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
      leadTime: 0,
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

  // Delivery options for Level 2
  deliveryOptions: [
    {
      id: 1,
      name: "Standard Delivery",
      leadTime: 3,
      description: "Standard delivery (3 days)",
    },
    {
      id: 2,
      name: "Express Delivery",
      leadTime: 1,
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
        { day: 3, requiredAmount: 20 },
        { day: 11, requiredAmount: 60 },
        { day: 20, requiredAmount: 120 },
      ],
      pricePerUnit: 49,
      transportCosts: { 20: 140, 40: 185, 100: 210 },
      allowedShipmentSizes: [20, 40, 100],
    },
    {
      id: 2,
      name: "Toast-to-go",
      description: "A quick-service restaurant requiring regular deliveries.",
      leadTime: 2,
      totalRequirement: 160,
      deliverySchedule: [
        { day: 6, requiredAmount: 40 },
        { day: 20, requiredAmount: 160 },
      ],
      pricePerUnit: 46,
      transportCosts: { 20: 145, 40: 192, 100: 220 },
      allowedShipmentSizes: [20, 40, 100],
    },
    {
      id: 3,
      name: "StudyFuel",
      description: "A campus food service catering to university students.",
      leadTime: 2,
      totalRequirement: 140,
      deliverySchedule: [
        { day: 8, requiredAmount: 60 },
        { day: 12, requiredAmount: 100 },
        { day: 20, requiredAmount: 140 },
      ],
      pricePerUnit: 47,
      transportCosts: { 20: 150, 40: 200, 100: 225 },
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
