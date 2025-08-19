import type {
  GameState,
  LevelConfig,
  Supplier,
  MaterialType,
  InventoryHoldingCosts,
  InventoryOverstockCosts,
  GameAction
} from "@/types/game"

// Production constants
export const PATTIES_PER_MEAL = 1
export const CHEESE_PER_MEAL = 3
export const BUNS_PER_MEAL = 2
export const POTATOES_PER_MEAL = 4

/**
 * Calculate the unit cost for a material purchase including transport costs
 */
export function calculateUnitCost(
  quantity: number,
  materialType: MaterialType,
  supplier: Supplier,
): number {
  // Get base price
  let basePrice = 0
  if (supplier.materialPrices && supplier.materialPrices[materialType]) {
    basePrice = supplier.materialPrices[materialType]
  }

  // Get shipment pricing
  let shipmentCostPerUnit = 0
  if (
    supplier.shipmentPrices &&
    supplier.shipmentPrices[materialType] &&
    supplier.shipmentPrices[materialType][quantity]
  ) {
    shipmentCostPerUnit = supplier.shipmentPrices[materialType][quantity] / quantity
  }

  // Return cost per unit
  return basePrice + shipmentCostPerUnit
}

/**
 * Calculate average cost per unit for a material
 */
function calculateAverageCost(
  materialType: MaterialType | "finishedGoods",
  gameState: GameState
): number {
  const quantity = gameState.inventory[materialType]
  const totalValue = gameState.inventoryValue[materialType]

  return quantity > 0 ? totalValue / quantity : 0
}

/**
 * Calculate holding costs based on inventory value (25% annual rate)
 * Only applies to inventory with value (purchased/produced inventory)
 */
export function calculateHoldingCost(gameState: GameState): number {

  // Get holding cost breakdown
  const holdingCostBreakdown = getHoldingCostBreakdown(gameState)

  // Return sum of all material types
  return Object.values(holdingCostBreakdown).reduce((sum, value) => sum + value, 0)
}

/**
 * Get breakdown of base holding costs by material type
 */
export function getHoldingCostBreakdown(gameState: GameState): InventoryHoldingCosts {

  // Apply 25% annual rate converted to daily (divide by 365)
  const annualRate = 0.25
  const daysInYear = 365

  return {
    patty: (gameState.inventoryValue.patty * annualRate) / daysInYear,
    bun: (gameState.inventoryValue.bun * annualRate) / daysInYear,
    cheese: (gameState.inventoryValue.cheese * annualRate) / daysInYear,
    potato: (gameState.inventoryValue.potato * annualRate) / daysInYear,
    finishedGoods: (gameState.inventoryValue.finishedGoods * annualRate) / daysInYear,
  }
}

/**
 * Calculate overstock costs based on inventory value and quantity exceeding overstock threshold (25% annual rate)
 */
export function calculateOverstockCost(gameState: GameState, levelConfig: LevelConfig): number {

  // Get overstock cost breakdown
  const overstockCostBreakdown = getOverstockCostBreakdown(gameState, levelConfig)

  // Return sum of all material types
  return Object.values(overstockCostBreakdown).reduce((sum, value) => sum + value, 0)

}

/**
 * Get breakdown of overstock costs by material type
 */
export function getOverstockCostBreakdown(gameState: GameState, levelConfig: LevelConfig): InventoryOverstockCosts {

  // Apply 25% annual rate converted to daily (divide by 365)
  const annualRate = 0.25
  const daysInYear = 365

  const materials = ["patty", "bun", "cheese", "potato", "finishedGoods"] as const;

  const overstockCosts: Record<MaterialType | "finishedGoods", number> = {} as Record<MaterialType | "finishedGoods", number>;

  for (const material of materials) {
    const inventory = gameState.inventory[material] ?? 0;
    const threshold = levelConfig.overstock[material]?.threshold ?? 0;
    const penalty = levelConfig.overstock[material]?.penaltyPerUnit ?? 0;

    const overstockQty = Math.max(0, inventory - threshold);
    const unitValue = calculateAverageCost(material, gameState);
    const cost = (unitValue * overstockQty * penalty * annualRate) / daysInYear;

    overstockCosts[material] = cost;
  }

  return overstockCosts;
}

/**
 * Update inventory and inventory value when adding new materials
 */
export function addInventoryValue(
  gameState: GameState,
  materialType: MaterialType | "finishedGoods",
  quantity: number,
  totalCost: number
): void {
  // Add to inventory quantity
  gameState.inventory[materialType] += quantity

  // Add to inventory value
  gameState.inventoryValue[materialType] += totalCost
}

/**
 * Remove inventory value when consuming materials
 */
export function removeInventoryValue(
  gameState: GameState,
  materialType: MaterialType | "finishedGoods",
  quantity: number
): void {
  // Calculate value to remove (average cost × quantity)
  const averageCost = calculateAverageCost(materialType, gameState)
  const valueToRemove = averageCost * quantity

  // Remove from inventory quantity
  gameState.inventory[materialType] -= quantity

  // Remove from inventory value
  gameState.inventoryValue[materialType] -= valueToRemove
}

/**
 * Calculate transportation cost for supplier orders
 */
export function calculateTransportationCost(
  action: GameAction,
  levelConfig: LevelConfig
): number {
  let total = 0

  for (const order of action.supplierOrders) {
    const supplier = levelConfig.suppliers.find((s) => s.id === order.supplierId)
    if (!supplier?.shipmentPrices) continue

    // For each material, find the closest shipment size and add its price
    for (const material of ["patty", "cheese", "bun", "potato"] as const) {
      const amount = order[`${material}Purchase`]
      if (amount > 0 && supplier.shipmentPrices[material]) {
        const sizes = Object.keys(supplier.shipmentPrices[material]).map(Number)
        // Find the closest shipment size (or the largest not exceeding the amount)
        const closest = sizes.reduce((prev, curr) =>
          Math.abs(curr - amount) < Math.abs(prev - amount) ? curr : prev,
          sizes[0]
        )
        total += supplier.shipmentPrices[material][closest]
      }
    }
  }

  return total
}

/**
 * Calculate customer transportation cost for restaurant deliveries
 */
export function calculateCustomerTransportationCost(
  action: GameAction,
  levelConfig: LevelConfig
): number {
  let total = 0

  if (!action.customerOrders || !levelConfig.customers) {
    return total
  }

  for (const customerOrder of action.customerOrders) {
    if (customerOrder.quantity > 0) {
      const customer = levelConfig.customers.find(c => c.id === customerOrder.customerId)
      if (customer && customer.transportCosts) {
        const transportCosts = customer.transportCosts
        const orderQuantity = customerOrder.quantity

        // Check if exact quantity exists
        if (transportCosts[orderQuantity]) {
          total += transportCosts[orderQuantity]
        } else {
          // Find the smallest shipment size that can handle this quantity
          const availableSizes = Object.keys(transportCosts).map(Number).sort((a, b) => a - b)
          const suitableSize = availableSizes.find(size => size >= orderQuantity)

          if (suitableSize) {
            total += transportCosts[suitableSize]
          }
        }
      }
    }
  }

  return total
}
