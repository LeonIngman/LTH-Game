import { v4 as uuidv4 } from "uuid"
import type {
  InventoryTransaction,
  FinishedGoodsBatch,
  DailyInventoryValuation,
  InventoryHoldingCosts,
  GameState,
  LevelConfig,
  Supplier,
} from "@/types/game"
import { PATTIES_PER_MEAL, CHEESE_PER_MEAL, BUNS_PER_MEAL, POTATOES_PER_MEAL } from "@/lib/constants"

/**
 * Safely get timestamp for sorting - handles both Date objects and strings
 */
function getTimestamp(timestamp: Date | string): number {
  if (timestamp instanceof Date) {
    return timestamp.getTime()
  }
  if (typeof timestamp === "string") {
    return new Date(timestamp).getTime()
  }
  return 0
}

/**
 * Calculate the unit cost for a material purchase including transport costs
 */
export function calculateUnitCost(
  quantity: number,
  materialType: string,
  supplier: Supplier,
  levelConfig: LevelConfig,
  deliveryMultiplier: number,
): number {
  // Get base price
  let basePrice = 0
  if (supplier.materialBasePrices && supplier.materialBasePrices[materialType]) {
    basePrice = supplier.materialBasePrices[materialType]
  } else {
    basePrice = levelConfig.materialBasePrices[materialType]
  }

  // Check for special shipment pricing
  if (
    supplier.shipmentPrices &&
    supplier.shipmentPrices[materialType] &&
    supplier.shipmentPrices[materialType][quantity]
  ) {
    if (supplier.shipmentPricesIncludeBaseCost) {
      return supplier.shipmentPrices[materialType][quantity] / quantity
    } else {
      const shipmentCostPerUnit = supplier.shipmentPrices[materialType][quantity] / quantity
      return basePrice + shipmentCostPerUnit
    }
  }

  // Standard pricing with delivery multiplier
  const costMultiplier = supplier.costMultiplier || 1.0
  return basePrice * costMultiplier * deliveryMultiplier
}

/**
 * Add inventory transaction when materials are purchased
 */
export function addInventoryTransaction(
  gameState: GameState,
  materialType: "patty" | "cheese" | "bun" | "potato",
  quantity: number,
  unitCost: number,
  day: number,
  supplierId: number,
  deliveryOptionId: number,
): void {
  const transaction: InventoryTransaction = {
    id: uuidv4(),
    materialType,
    quantity,
    unitCost,
    totalCost: quantity * unitCost,
    day,
    supplierId,
    deliveryOptionId,
    timestamp: new Date(),
  }

  gameState.inventoryTransactions.push(transaction)
}

/**
 * Calculate current inventory value using FIFO
 * Starting inventory has no value, only purchased inventory has value
 */
export function calculateInventoryValue(
  materialType: "patty" | "cheese" | "bun" | "potato",
  currentQuantity: number,
  transactions: InventoryTransaction[],
): number {
  // Filter transactions for this material type and sort by day (FIFO)
  const materialTransactions = transactions
    .filter((t) => t.materialType === materialType)
    .sort((a, b) => a.day - b.day || getTimestamp(a.timestamp) - getTimestamp(b.timestamp))

  // If no transactions, the inventory has no value (starting inventory)
  if (materialTransactions.length === 0) {
    return 0
  }

  // Calculate total purchased quantity
  const totalPurchased = materialTransactions.reduce((sum, t) => sum + t.quantity, 0)

  // If current quantity is less than or equal to purchased quantity, use FIFO from purchases
  if (currentQuantity <= totalPurchased) {
    let remainingQuantity = currentQuantity
    let totalValue = 0

    // Work backwards through transactions to find the most recent purchases
    for (let i = materialTransactions.length - 1; i >= 0 && remainingQuantity > 0; i--) {
      const transaction = materialTransactions[i]
      const quantityToUse = Math.min(remainingQuantity, transaction.quantity)

      totalValue += quantityToUse * transaction.unitCost
      remainingQuantity -= quantityToUse
    }

    return totalValue
  } else {
    // If current quantity exceeds purchased quantity, only the purchased portion has value
    // The excess is starting inventory with zero value
    let totalValue = 0
    for (const transaction of materialTransactions) {
      totalValue += transaction.quantity * transaction.unitCost
    }
    return totalValue
  }
}

/**
 * Process production using FIFO costing
 * Starting inventory is consumed first (at zero cost), then purchased inventory
 */
export function processProductionWithFIFO(
  gameState: GameState,
  productionQuantity: number,
  productionCostPerUnit: number,
  day: number,
): { success: boolean; actualProduction: number; rawMaterialCosts: any } {
  if (productionQuantity <= 0) {
    return { success: true, actualProduction: 0, rawMaterialCosts: { patty: 0, cheese: 0, bun: 0, potato: 0 } }
  }

  // Check if we have enough materials
  const requiredPatties = productionQuantity * PATTIES_PER_MEAL
  const requiredCheese = productionQuantity * CHEESE_PER_MEAL
  const requiredBuns = productionQuantity * BUNS_PER_MEAL
  const requiredPotatoes = productionQuantity * POTATOES_PER_MEAL

  if (
    gameState.inventory.patty < requiredPatties ||
    gameState.inventory.cheese < requiredCheese ||
    gameState.inventory.bun < requiredBuns ||
    gameState.inventory.potato < requiredPotatoes
  ) {
    return { success: false, actualProduction: 0, rawMaterialCosts: { patty: 0, cheese: 0, bun: 0, potato: 0 } }
  }

  // Calculate raw material costs using FIFO (starting inventory first, then purchased)
  const pattyCost = consumeInventoryFIFO(gameState, "patty", requiredPatties)
  const cheeseCost = consumeInventoryFIFO(gameState, "cheese", requiredCheese)
  const bunCost = consumeInventoryFIFO(gameState, "bun", requiredBuns)
  const potatoCost = consumeInventoryFIFO(gameState, "potato", requiredPotatoes)

  const rawMaterialCosts = {
    patty: pattyCost,
    cheese: cheeseCost,
    bun: bunCost,
    potato: potatoCost,
  }

  const totalRawMaterialCost = pattyCost + cheeseCost + bunCost + potatoCost
  const totalProductionCost = productionQuantity * productionCostPerUnit
  const unitCost = (totalRawMaterialCost + totalProductionCost) / productionQuantity

  // Create finished goods batch
  const finishedGoodsBatch: FinishedGoodsBatch = {
    id: uuidv4(),
    quantity: productionQuantity,
    unitCost,
    totalCost: totalRawMaterialCost + totalProductionCost,
    day,
    rawMaterialCosts,
    productionCost: totalProductionCost,
    timestamp: new Date(),
  }

  gameState.finishedGoodsBatches.push(finishedGoodsBatch)

  // Update inventory quantities
  gameState.inventory.patty -= requiredPatties
  gameState.inventory.cheese -= requiredCheese
  gameState.inventory.bun -= requiredBuns
  gameState.inventory.potato -= requiredPotatoes
  gameState.inventory.finishedGoods += productionQuantity

  return { success: true, actualProduction: productionQuantity, rawMaterialCosts }
}

/**
 * Consume inventory using FIFO and return the total cost
 * Starting inventory is consumed first (at zero cost), then purchased inventory
 */
function consumeInventoryFIFO(
  gameState: GameState,
  materialType: "patty" | "cheese" | "bun" | "potato",
  quantityToConsume: number,
): number {
  const transactions = gameState.inventoryTransactions
    .filter((t) => t.materialType === materialType)
    .sort((a, b) => a.day - b.day || getTimestamp(a.timestamp) - getTimestamp(b.timestamp))

  // Calculate total purchased quantity
  const totalPurchased = transactions.reduce((sum, t) => sum + t.quantity, 0)
  const currentInventory = gameState.inventory[materialType]
  const startingInventory = Math.max(0, currentInventory - totalPurchased)

  let remainingToConsume = quantityToConsume
  let totalCost = 0

  // First, consume starting inventory (zero cost)
  if (startingInventory > 0 && remainingToConsume > 0) {
    const consumeFromStarting = Math.min(remainingToConsume, startingInventory)
    remainingToConsume -= consumeFromStarting
    // Starting inventory has zero cost, so no cost added
  }

  // Then, consume purchased inventory (with cost)
  for (const transaction of transactions) {
    if (remainingToConsume <= 0) break

    const quantityFromThisTransaction = Math.min(remainingToConsume, transaction.quantity)
    totalCost += quantityFromThisTransaction * transaction.unitCost
    remainingToConsume -= quantityFromThisTransaction

    // Update the transaction quantity (this represents what's left in this batch)
    transaction.quantity -= quantityFromThisTransaction
  }

  // Remove transactions with zero quantity
  gameState.inventoryTransactions = gameState.inventoryTransactions.filter((t) => t.quantity > 0)

  return totalCost
}

/**
 * Calculate daily inventory valuation
 * Starting inventory has no value, only purchased inventory
 */
export function calculateDailyInventoryValuation(gameState: GameState, day: number): DailyInventoryValuation {
  const pattyValue = calculateInventoryValue("patty", gameState.inventory.patty, gameState.inventoryTransactions)
  const cheeseValue = calculateInventoryValue("cheese", gameState.inventory.cheese, gameState.inventoryTransactions)
  const bunValue = calculateInventoryValue("bun", gameState.inventory.bun, gameState.inventoryTransactions)
  const potatoValue = calculateInventoryValue("potato", gameState.inventory.potato, gameState.inventoryTransactions)

  // Calculate finished goods value
  let finishedGoodsValue = 0
  let remainingFinishedGoods = gameState.inventory.finishedGoods
  const sortedBatches = gameState.finishedGoodsBatches.sort(
    (a, b) => a.day - b.day || getTimestamp(a.timestamp) - getTimestamp(b.timestamp),
  )

  for (const batch of sortedBatches) {
    if (remainingFinishedGoods <= 0) break
    const quantityFromBatch = Math.min(remainingFinishedGoods, batch.quantity)
    finishedGoodsValue += quantityFromBatch * batch.unitCost
    remainingFinishedGoods -= quantityFromBatch
  }

  const totalValue = pattyValue + cheeseValue + bunValue + potatoValue + finishedGoodsValue

  return {
    day,
    pattyValue,
    cheeseValue,
    bunValue,
    potatoValue,
    finishedGoodsValue,
    totalValue,
    pattyQuantity: gameState.inventory.patty,
    cheeseQuantity: gameState.inventory.cheese,
    bunQuantity: gameState.inventory.bun,
    potatoQuantity: gameState.inventory.potato,
    finishedGoodsQuantity: gameState.inventory.finishedGoods,
  }
}

/**
 * Calculate holding costs based on inventory value (25% annual rate)
 * Only applies to inventory with value (purchased inventory)
 */
export function calculateInventoryHoldingCosts(valuation: DailyInventoryValuation): InventoryHoldingCosts {
  const dailyRate = 0.25 / 365 // 25% annual rate divided by 365 days

  return {
    pattyHoldingCost: valuation.pattyValue * dailyRate,
    cheeseHoldingCost: valuation.cheeseValue * dailyRate,
    bunHoldingCost: valuation.bunValue * dailyRate,
    potatoHoldingCost: valuation.potatoValue * dailyRate,
    finishedGoodsHoldingCost: valuation.finishedGoodsValue * dailyRate,
    totalHoldingCost: valuation.totalValue * dailyRate,
  }
}

/**
 * Process finished goods sales using FIFO
 */
export function processFinishedGoodsSales(
  gameState: GameState,
  quantityToSell: number,
): { success: boolean; actualSales: number; costOfGoodsSold: number } {
  if (quantityToSell <= 0 || gameState.inventory.finishedGoods < quantityToSell) {
    return { success: false, actualSales: 0, costOfGoodsSold: 0 }
  }

  let remainingToSell = quantityToSell
  let costOfGoodsSold = 0

  // Sort batches by FIFO (oldest first)
  gameState.finishedGoodsBatches.sort((a, b) => a.day - b.day || getTimestamp(a.timestamp) - getTimestamp(b.timestamp))

  for (const batch of gameState.finishedGoodsBatches) {
    if (remainingToSell <= 0) break

    const quantityFromBatch = Math.min(remainingToSell, batch.quantity)
    costOfGoodsSold += quantityFromBatch * batch.unitCost
    remainingToSell -= quantityFromBatch
    batch.quantity -= quantityFromBatch
  }

  // Remove batches with zero quantity
  gameState.finishedGoodsBatches = gameState.finishedGoodsBatches.filter((batch) => batch.quantity > 0)

  // Update inventory
  gameState.inventory.finishedGoods -= quantityToSell

  return { success: true, actualSales: quantityToSell, costOfGoodsSold }
}

/**
 * Add immediate inventory for lead time = 0 orders
 */
export function addImmediateInventory(
  gameState: GameState,
  materialType: "patty" | "cheese" | "bun" | "potato",
  quantity: number,
  unitCost: number,
  supplierId: number,
  deliveryOptionId: number,
): void {
  // Add to inventory immediately
  gameState.inventory[materialType] += quantity

  // Add transaction for tracking
  addInventoryTransaction(gameState, materialType, quantity, unitCost, gameState.day, supplierId, deliveryOptionId)
}
