import type { Supplier } from "@/types/game"

/**
 * Creates suppliers with consistent properties across all levels,
 * but with level-specific lead times.
 */
export function createSuppliers(leadTimes: number[]): Supplier[] {
  return [
    {
      id: 1,
      name: "Pink Pantry",
      leadTime: leadTimes[0],
      description: "A local supplier with limited potato inventory but good prices on other items.",
      capacityPerDay: {
        patty: 150,
        cheese: 500,
        bun: 200,
        potato: 0,
      },
      shipmentPrices: {
        patty: { 50: 116, 100: 134, 200: 179 },
        bun: { 50: 89, 100: 98, 200: 134 },
        cheese: { 50: 65, 100: 89, 200: 116 },
        potato: { 50: 98, 100: 134, 200: 134 },
      },
    },
    {
      id: 2,
      name: "Brown Sauce",
      leadTime: leadTimes[1],
      description: "A supplier specializing in patties, buns, and potatoes, but no cheese.",
      capacityPerDay: {
        patty: 200,
        cheese: 0, // Not available for order
        bun: 200,
        potato: 850,
      },
      shipmentPrices: {
        patty: { 50: 121, 100: 139, 200: 186 },
        bun: { 50: 92, 100: 102, 200: 139 },
        cheese: { 50: 68, 100: 92, 200: 121 },
        potato: { 50: 102, 100: 122, 200: 139 },
      },
      materialBasePrices: {
        patty: 13,
        bun: 2.7,
        cheese: 0, // Not for sale
        potato: 1.6,
      },
    },
    {
      id: 3,
      name: "Firehouse Foods",
      leadTime: leadTimes[2],
      description: "Specializes in buns, cheese, and potatoes with competitive pricing.",
      capacityPerDay: {
        patty: 0, // Not available
        bun: 250,
        cheese: 500,
        potato: 700,
      },
      materialBasePrices: {
        patty: 0, // Not for sale
        bun: 3.4,
        cheese: 1.8,
        potato: 1.2,
      },
      shipmentPrices: {
        patty: { 50: 0, 100: 0, 150: 0 },
        bun: { 50: 126, 100: 145, 150: 175 },
        cheese: { 50: 96, 100: 106, 150: 126 },
        potato: { 50: 106, 100: 145, 150: 145 },
      },
      orderQuantities: [50, 100, 150], // Specific order quantities for this supplier
    },
  ]
}
