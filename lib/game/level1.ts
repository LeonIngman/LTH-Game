import type { LevelConfig, DailyDemand } from "@/types/game"
import { baseLevelConfig } from "./level-base"

/**
 * Level 1 configuration - Timing is Everything
 */
export const level1Config: LevelConfig = {
  ...baseLevelConfig,
  id: 1,
  name: "Timing is Everything",
  description: "Manage your burger restaurant supply chain with a fixed 2-day delivery time",
  daysToComplete: 30,

  // Suppliers for Level 1 - with leadTime of 2 days
  suppliers: [
    {
      id: 1,
      name: "Pink Patty",
      leadTime: 2,
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
      leadTime: 2,
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
      leadTime: 2,
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
      leadTime: 1,
      totalRequirement: 80,
      deliverySchedule: [
        { day: 3, requiredAmount: 20 },
        { day: 30, requiredAmount: 60 },
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
        { day: 30, requiredAmount: 80 },
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
        { day: 30, requiredAmount: 40 },
      ],
      pricePerUnit: 47,
      transportCosts: { 20: 145, 40: 194, 100: 222 },
      allowedShipmentSizes: [20, 40, 100],
      minimumDeliveryAmount: 20,
      active: true,
    },
  ],

  // Demand model for Level 1 - more variable demand
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

  productionCostPerUnit: 4,

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
