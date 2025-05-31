import type {
  GameState,
  GameAction,
  LevelConfig,
  DailyResult,
  PendingOrder,
  GameResult,
  Supplier,
  DeliveryOption,
  CustomerOrder,
  Customer,
  LatenessPenalty,
  DailyInventoryValuation,
  InventoryHoldingCosts,
} from "@/types/game"
import {
  calculateUnitCost,
  addInventoryTransaction,
  calculateDailyInventoryValuation,
  calculateInventoryHoldingCosts,
  processFinishedGoodsSales,
} from "@/lib/game/inventory-management"

/**
 * Initialize a new game state based on level configuration
 */
export function initializeGameState(levelConfig: LevelConfig): GameState {
  // Set default delivery option to the standard one
  const defaultDeliveryOptionId =
    levelConfig.deliveryOptions && levelConfig.deliveryOptions.length > 0
      ? levelConfig.deliveryOptions[1]?.id || levelConfig.deliveryOptions[0].id
      : 2

  return {
    day: 1,
    cash: levelConfig.initialCash,
    inventory: { ...levelConfig.initialInventory },
    inventoryTransactions: [],
    finishedGoodsBatches: [],
    dailyInventoryValuations: [],
    pendingOrders: [],
    pendingCustomerOrders: [],
    customerDeliveries: {},
    supplierDeliveries: {}, // <-- Add this line
    dailyDemand: levelConfig.demandModel(1),
    productionCapacity: 50, // Default value, can be adjusted per level
    cumulativeProfit: 0,
    score: 0,
    history: [],
    selectedDeliveryOption: defaultDeliveryOptionId,
    gameOver: false,
    latenessPenalties: [],
  }
}

/**
 * Validate if the player can afford all actions
 */
export function validateAffordability(
  gameState: GameState,
  action: GameAction,
  levelConfig: LevelConfig,
): {
  valid: boolean
  message?: string
  totalCost?: number
  holdingCost?: number
  availableCash?: number
} {
  // Calculate total purchase cost
  let totalPurchaseCost = 0

  // Get delivery option
  const deliveryOption = levelConfig.deliveryOptions?.find((d) => d.id === action.deliveryOptionId)
  const deliveryMultiplier = deliveryOption ? deliveryOption.costMultiplier : 1.0

  // Process orders from each supplier
  for (const order of action.supplierOrders) {
    const supplier = levelConfig.suppliers.find((s) => s.id === order.supplierId)
    if (!supplier) continue

    // Calculate cost for each material
    if (order.pattyPurchase > 0) {
      const unitCost = calculateUnitCost(order.pattyPurchase, "patty", supplier, levelConfig, deliveryMultiplier)
      totalPurchaseCost += order.pattyPurchase * unitCost
    }

    if (order.cheesePurchase > 0) {
      const unitCost = calculateUnitCost(order.cheesePurchase, "cheese", supplier, levelConfig, deliveryMultiplier)
      totalPurchaseCost += order.cheesePurchase * unitCost
    }

    if (order.bunPurchase > 0) {
      const unitCost = calculateUnitCost(order.bunPurchase, "bun", supplier, levelConfig, deliveryMultiplier)
      totalPurchaseCost += order.bunPurchase * unitCost
    }

    if (order.potatoPurchase > 0) {
      const unitCost = calculateUnitCost(order.potatoPurchase, "potato", supplier, levelConfig, deliveryMultiplier)
      totalPurchaseCost += order.potatoPurchase * unitCost
    }
  }

  // Calculate production cost
  const productionCost = action.production * levelConfig.productionCostPerUnit

  // Calculate total action cost
  const totalActionCost = totalPurchaseCost + productionCost

  // Calculate holding cost using new inventory valuation method
  const currentValuation = calculateDailyInventoryValuation(gameState, gameState.day)
  const holdingCosts = calculateInventoryHoldingCosts(currentValuation)
  const holdingCost = holdingCosts.totalHoldingCost

  // Calculate total cost
  const totalCost = totalActionCost + holdingCost

  // Check if player has enough cash
  if (totalCost > gameState.cash) {
    return {
      valid: false,
      message: `Insufficient funds. Total cost: ${totalCost.toFixed(2)} kr, Available cash: ${gameState.cash.toFixed(2)} kr`,
      totalCost,
      holdingCost,
      availableCash: gameState.cash,
    }
  }

  return { valid: true, totalCost, holdingCost, availableCash: gameState.cash }
}

/**
 * Check for missed customer milestones and calculate penalties
 */
function checkMissedMilestones(state: GameState, levelConfig: LevelConfig): LatenessPenalty[] {
  const penalties: LatenessPenalty[] = []

  // Skip if no customers
  if (!levelConfig.customers || levelConfig.customers.length === 0) {
    return penalties
  }

  // Check each customer's delivery schedule
  for (const customer of levelConfig.customers) {
    if (!customer.active) continue

    // Find milestones that were due on the current day
    const dueMilestones = customer.deliverySchedule.filter((milestone) => milestone.day === state.day)

    if (dueMilestones.length === 0) continue

    // Get total delivered so far
    const totalDelivered = state.customerDeliveries[customer.id] || 0

    // Calculate cumulative required amount up to this milestone
    const cumulativeRequired = customer.deliverySchedule
      .filter((item) => item.day <= state.day)
      .reduce((sum, item) => sum + item.requiredAmount, 0)

    // If we haven't delivered enough, apply penalty
    if (totalDelivered < cumulativeRequired) {
      const missedAmount = cumulativeRequired - totalDelivered
      const penaltyAmount = 0.4 * missedAmount * customer.pricePerUnit

      penalties.push({
        customerId: customer.id,
        customerName: customer.name,
        day: state.day,
        missedAmount: missedAmount,
        penaltyAmount: penaltyAmount,
      })

      // Deduct penalty from cash
      state.cash = Number.parseFloat((state.cash - penaltyAmount).toFixed(2))
    }
  }

  return penalties
}

/**
 * Process production using FIFO costing
 */
function processProduction(state: GameState, action: GameAction, levelConfig: LevelConfig): void {
  if (action.production <= 0) return

  const PATTIES_PER_MEAL = 1
  const CHEESE_PER_MEAL = 1
  const BUNS_PER_MEAL = 1
  const POTATOES_PER_MEAL = 1

  // Calculate maximum possible production
  const maxProductionByPatty = Math.floor(state.inventory.patty / PATTIES_PER_MEAL)
  const maxProductionByCheese = Math.floor(state.inventory.cheese / CHEESE_PER_MEAL)
  const maxProductionByBun = Math.floor(state.inventory.bun / BUNS_PER_MEAL)
  const maxProductionByPotato = Math.floor(state.inventory.potato / POTATOES_PER_MEAL)

  const maxProduction = Math.min(
    maxProductionByPatty,
    maxProductionByCheese,
    maxProductionByBun,
    maxProductionByPotato,
    state.productionCapacity,
    action.production,
  )

  if (maxProduction > 0) {
    // Deduct raw materials from inventory
    state.inventory.patty -= maxProduction * PATTIES_PER_MEAL
    state.inventory.cheese -= maxProduction * CHEESE_PER_MEAL
    state.inventory.bun -= maxProduction * BUNS_PER_MEAL
    state.inventory.potato -= maxProduction * POTATOES_PER_MEAL

    // Add finished goods to inventory
    state.inventory.finishedGoods += maxProduction

    // Deduct production cost from cash
    const totalProductionCost = maxProduction * levelConfig.productionCostPerUnit
    state.cash = Number.parseFloat((state.cash - totalProductionCost).toFixed(2))
  }
}

/**
 * Process sales using FIFO costing
 */
function processSales(state: GameState, action: GameAction, levelConfig: LevelConfig): void {
  // Calculate actual sales based on inventory and sales attempt
  const actualSales = Math.min(state.inventory.finishedGoods, action.salesAttempt)

  if (actualSales > 0) {
    // Process sales using FIFO costing
    const salesResult = processFinishedGoodsSales(state, actualSales)

    if (salesResult.success) {
      // Calculate revenue using the current price per unit from dailyDemand
      const revenue = actualSales * state.dailyDemand.pricePerUnit

      // Update cash
      state.cash = Number.parseFloat((state.cash + revenue).toFixed(2))
    }
  }
}

/**
 * Process a single day of gameplay based on player actions
 */
export function processDay(state: GameState, action: GameAction, levelConfig: LevelConfig): GameState {
  // Create a copy of the current state to modify
  const newState: GameState = JSON.parse(JSON.stringify(state))

  // Store the initial cash value to calculate daily profit later
  const initialCash = newState.cash

  // Ensure action has all required properties
  action = {
    supplierOrders: action.supplierOrders || [],
    production: action.production || 0,
    salesAttempt: action.salesAttempt || 0,
    deliveryOptionId: action.deliveryOptionId || 2,
    customerOrders: action.customerOrders || [],
  }

  // Update selected delivery option
  newState.selectedDeliveryOption = action.deliveryOptionId

  // 1. Process pending orders (materials arriving)
  processPendingOrders(newState)

  // 2. Process pending customer orders (revenue from previous days)
  processPendingCustomerOrders(newState)

  // 3. Process new purchases and deduct costs
  processPurchases(newState, action, levelConfig)

  // 4. Process production using FIFO costing
  processProduction(newState, action, levelConfig)

  // 5. Process sales using FIFO costing
  processSales(newState, action, levelConfig)

  // 6. Process customer orders
  processCustomerOrders(newState, action, levelConfig)

  // 7. Check for missed milestones and apply penalties
  const latenessPenalties = checkMissedMilestones(newState, levelConfig)

  // Add penalties to state
  if (latenessPenalties.length > 0) {
    if (!newState.latenessPenalties) {
      newState.latenessPenalties = []
    }
    newState.latenessPenalties = [...newState.latenessPenalties, ...latenessPenalties]
  }

  // 8. Calculate daily inventory valuation and holding costs
  const dailyValuation = calculateDailyInventoryValuation(newState, newState.day)
  const holdingCosts = calculateInventoryHoldingCosts(dailyValuation)

  // Store the daily valuation
  newState.dailyInventoryValuations.push(dailyValuation)

  // 9. Deduct holding costs
  newState.cash = Number.parseFloat((newState.cash - holdingCosts.totalHoldingCost).toFixed(2))

  // --- Add this block for overstock penalty ---
  const overstockResult = calculateOverstockPenalty(newState, levelConfig)
  if (!newState.overstockPenalties) newState.overstockPenalties = []
  newState.overstockPenalties.push({
    day: newState.day,
    penalty: typeof overstockResult.total === "number" ? overstockResult.total : 0,
    details: overstockResult.details ?? {},
  })
  if (overstockResult.total > 0) {
    newState.cash = Number.parseFloat((newState.cash - overstockResult.total).toFixed(2))
  }
  // --------------------------------------------

  // 10. Calculate daily profit and update cumulative profit
  const dailyProfit = newState.cash - initialCash
  newState.cumulativeProfit += dailyProfit

  // 11. Calculate score
  newState.score = calculateScore(newState, levelConfig)

  // 12. Record daily results in history
  recordDailyResults(newState, action, dailyProfit, levelConfig, dailyValuation, holdingCosts, latenessPenalties, overstockResult) // <-- pass this in

  // 13. Check if player is bankrupt (cash <= 0)
  if (newState.cash <= 0 && !canRecoverFromZeroCash(newState)) {
    newState.gameOver = true
    console.log("GAME OVER: Player is bankrupt with cash:", newState.cash)
  }

  // 14. Advance to next day and update demand (only if not game over)
  if (!newState.gameOver) {
    newState.day += 1
    newState.dailyDemand = levelConfig.demandModel(newState.day)
  }

  return newState
}

/**
 * Check if player can recover from zero cash
 * (they can recover if they have finished goods to sell)
 */
function canRecoverFromZeroCash(state: GameState): boolean {
  return state.inventory.finishedGoods > 0
}

/**
 * Process any pending orders that are due to arrive
 */
function processPendingOrders(state: GameState): void {
  const arrivingOrders: PendingOrder[] = []
  const remainingOrders: PendingOrder[] = []

  for (const order of state.pendingOrders) {
    if (order.daysRemaining <= 1) {
      arrivingOrders.push(order)
    } else {
      remainingOrders.push({
        ...order,
        daysRemaining: order.daysRemaining - 1,
      })
    }
  }

  for (const order of arrivingOrders) {
    state.inventory[order.materialType] += order.quantity
    const unitCost = order.totalCost / order.quantity
    addInventoryTransaction(
      state,
      order.materialType as "patty" | "cheese" | "bun" | "potato",
      order.quantity,
      unitCost,
      state.day,
      order.supplierId,
      order.deliveryOptionId,
    )
  }

  state.pendingOrders = remainingOrders
}

/**
 * Process pending customer orders
 */
function processPendingCustomerOrders(state: GameState): void {
  const arrivingOrders: CustomerOrder[] = []
  const remainingOrders: CustomerOrder[] = []

  // Check each pending customer order
  for (const order of state.pendingCustomerOrders) {
    if (order.daysRemaining <= 1) {
      // Order arrives today - process the delivery
      arrivingOrders.push(order)
    } else {
      // Order will arrive in the future
      remainingOrders.push({
        ...order,
        daysRemaining: order.daysRemaining - 1,
      })
    }
  }

  // Process arriving orders (add revenue)
  for (const order of arrivingOrders) {
    // Add revenue from this order
    state.cash = Number.parseFloat((state.cash + order.netRevenue).toFixed(2))

    // Update customer delivery tracking
    if (!state.customerDeliveries[order.customerId]) {
      state.customerDeliveries[order.customerId] = 0
    }
    state.customerDeliveries[order.customerId] += order.quantity
  }

  // Update pending customer orders
  state.pendingCustomerOrders = remainingOrders
}

/**
 * Get supplier by ID from level config
 */
function getSupplier(supplierId: number, levelConfig: LevelConfig): Supplier | null {
  if (!levelConfig.suppliers) return null
  return levelConfig.suppliers.find((s) => s.id === supplierId) || null
}

/**
 * Get customer by ID from level config
 */
function getCustomer(customerId: number, levelConfig: LevelConfig): Customer | null {
  if (!levelConfig.customers) return null
  return levelConfig.customers.find((c) => c.id === customerId) || null
}

/**
 * Get delivery option by ID from level config
 */
function getDeliveryOption(deliveryOptionId: number, levelConfig: LevelConfig): DeliveryOption | null {
  if (!levelConfig.deliveryOptions) return null
  return levelConfig.deliveryOptions.find((d) => d.id === deliveryOptionId) || null
}

/**
 * Get random lead time for suppliers/customers with random lead times
 */
function getRandomLeadTime(entity: Supplier | Customer): number {
  if (entity.randomLeadTime && entity.leadTimeRange) {
    const randomIndex = Math.floor(Math.random() * entity.leadTimeRange.length)
    return entity.leadTimeRange[randomIndex]
  }
  return entity.leadTime
}

// Update processPurchases function to use random lead time for Brown Sauce supplier
function processPurchases(state: GameState, action: GameAction, levelConfig: LevelConfig): void {
  // Get selected delivery option
  const deliveryOption = getDeliveryOption(action.deliveryOptionId, levelConfig)
  const deliveryOptionLeadTime = deliveryOption
    ? deliveryOption.leadTime
    : action.deliveryOptionId === 1
      ? 1
      : action.deliveryOptionId === 3
        ? 5
        : 3
  const deliveryName = deliveryOption
    ? deliveryOption.name
    : action.deliveryOptionId === 1
      ? "Express Delivery"
      : action.deliveryOptionId === 3
        ? "Economy Delivery"
        : "Standard Delivery"

  const deliveryMultiplier = deliveryOption ? deliveryOption.costMultiplier : 1.0

  // Process orders from each supplier
  for (const order of action.supplierOrders) {
    const supplier = getSupplier(order.supplierId, levelConfig)
    if (!supplier) continue

    const supplierName = supplier.name

    // Get actual lead time (random for Brown Sauce supplier in Level 3)
    const supplierLeadTime = getRandomLeadTime(supplier)

    // For suppliers with random lead times, use the supplier's lead time directly
    // For regular suppliers, use the max of delivery option and supplier lead time
    const totalLeadTime = supplier.randomLeadTime
      ? supplierLeadTime
      : Math.max(deliveryOptionLeadTime, supplierLeadTime)

    // Process each material type
    const materials = [
      { type: "patty" as const, quantity: order.pattyPurchase },
      { type: "cheese" as const, quantity: order.cheesePurchase },
      { type: "bun" as const, quantity: order.bunPurchase },
      { type: "potato" as const, quantity: order.potatoPurchase },
    ]

    for (const material of materials) {
      if (material.quantity > 0) {
        // Calculate unit cost including transport
        const unitCost = calculateUnitCost(material.quantity, material.type, supplier, levelConfig, deliveryMultiplier)
        const totalCost = material.quantity * unitCost

        // Deduct cost from cash
        state.cash = Number.parseFloat((state.cash - totalCost).toFixed(2))

        // Always update deliveredSoFar immediately
        if (!state.supplierDeliveries[order.supplierId]) state.supplierDeliveries[order.supplierId] = {}
        state.supplierDeliveries[order.supplierId][material.type] =
          (state.supplierDeliveries[order.supplierId][material.type] || 0) + material.quantity

        if (totalLeadTime === 0) {
          // For level 0 with instant delivery (leadTime = 0), add directly to inventory
          state.inventory[material.type] += material.quantity

          // Add inventory transaction for tracking
          addInventoryTransaction(
            state,
            material.type,
            material.quantity,
            unitCost,
            state.day,
            order.supplierId,
            action.deliveryOptionId,
          )
        } else {
          // Add to pending orders with lead time
          state.pendingOrders.push({
            materialType: material.type,
            quantity: material.quantity,
            daysRemaining: totalLeadTime,
            totalCost: totalCost,
            supplierId: order.supplierId,
            deliveryOptionId: action.deliveryOptionId,
            deliveryName: deliveryName,
            supplierName: supplierName,
            actualLeadTime: supplierLeadTime,
          })
        }
      }
    }
  }
}

// Update processCustomerOrders function to use random lead time for Yummy Zone
function processCustomerOrders(state: GameState, action: GameAction, levelConfig: LevelConfig): void {
  // Process each customer order
  for (const customerOrder of action.customerOrders || []) {
    const customer = getCustomer(customerOrder.customerId, levelConfig)
    if (!customer || !customer.active) continue

    // Check if we have enough inventory
    if (customerOrder.quantity > state.inventory.finishedGoods) {
      continue // Skip this order if not enough inventory
    }

    // Check if the order quantity is valid
    if (!customer.allowedShipmentSizes.includes(customerOrder.quantity)) {
      continue // Skip if not an allowed shipment size
    }

    // Check if the order meets minimum requirements
    if (customerOrder.quantity < customer.minimumDeliveryAmount) {
      continue // Skip if below minimum delivery amount
    }

    // Process the sale using FIFO costing
    const salesResult = processFinishedGoodsSales(state, customerOrder.quantity)

    if (salesResult.success) {
      // Calculate revenue and transport cost
      const revenue = customerOrder.quantity * customer.pricePerUnit
      const transportCost = customer.transportCosts[customerOrder.quantity] || 0
      const netRevenue = revenue - transportCost

      // Get actual lead time (random for Yummy Zone in Level 3)
      const actualLeadTime = getRandomLeadTime(customer)

      // If lead time is 0, add revenue immediately
      if (actualLeadTime === 0) {
        state.cash = Number.parseFloat((state.cash + netRevenue).toFixed(2))

        // Update customer delivery tracking
        if (!state.customerDeliveries[customer.id]) {
          state.customerDeliveries[customer.id] = 0
        }
        state.customerDeliveries[customer.id] += customerOrder.quantity
      } else {
        // Otherwise, add to pending customer orders
        state.pendingCustomerOrders.push({
          customerId: customer.id,
          quantity: customerOrder.quantity,
          daysRemaining: actualLeadTime,
          totalRevenue: revenue,
          transportCost: transportCost,
          netRevenue: netRevenue,
          actualLeadTime: actualLeadTime, // Store the actual lead time used
        })
      }
    }
  }
}

/**
 * Calculate score based on cumulative profit and other factors
 */
function calculateScore(state: GameState, levelConfig: LevelConfig): number {
  // Basic score calculation based on profit
  const score = Math.floor(state.cumulativeProfit / 100)

  // Cap at max score for the level
  return Math.min(score, levelConfig.maxScore)
}

/**
 * Record daily results in history
 */
function recordDailyResults(
  state: GameState,
  action: GameAction,
  dailyProfit: number,
  levelConfig: LevelConfig,
  dailyValuation: DailyInventoryValuation,
  holdingCosts: InventoryHoldingCosts,
  latenessPenalties: LatenessPenalty[],
  overstockResult: { total: number; details: Record<string, number> } // <-- add this
): void {
  // Calculate total purchases from all suppliers
  let totalPattyPurchased = 0
  let totalCheesePurchased = 0
  let totalBunPurchased = 0
  let totalPotatoPurchased = 0
  let totalPurchaseCost = 0

  // Get delivery option
  const deliveryOption = levelConfig.deliveryOptions?.find((d) => d.id === action.deliveryOptionId)
  const deliveryMultiplier = deliveryOption ? deliveryOption.costMultiplier : 1.0

  for (const order of action.supplierOrders) {
    const supplier = levelConfig.suppliers.find((s) => s.id === order.supplierId)
    if (!supplier) continue

    totalPattyPurchased += order.pattyPurchase
    totalCheesePurchased += order.cheesePurchase
    totalBunPurchased += order.bunPurchase
    totalPotatoPurchased += order.potatoPurchase

    // Calculate purchase costs
    if (order.pattyPurchase > 0) {
      const unitCost = calculateUnitCost(order.pattyPurchase, "patty", supplier, levelConfig, deliveryMultiplier)
      totalPurchaseCost += order.pattyPurchase * unitCost
    }
    if (order.cheesePurchase > 0) {
      const unitCost = calculateUnitCost(order.cheesePurchase, "cheese", supplier, levelConfig, deliveryMultiplier)
      totalPurchaseCost += order.cheesePurchase * unitCost
    }
    if (order.bunPurchase > 0) {
      const unitCost = calculateUnitCost(order.bunPurchase, "bun", supplier, levelConfig, deliveryMultiplier)
      totalPurchaseCost += order.bunPurchase * unitCost
    }
    if (order.potatoPurchase > 0) {
      const unitCost = calculateUnitCost(order.potatoPurchase, "potato", supplier, levelConfig, deliveryMultiplier)
      totalPurchaseCost += order.potatoPurchase * unitCost
    }
  }

  // Calculate production cost
  const totalProductionCost = action.production * levelConfig.productionCostPerUnit

  // Calculate revenue from regular sales
  const actualSales = Math.min(state.inventory.finishedGoods + action.production, action.salesAttempt)
  const revenue = actualSales * state.dailyDemand.pricePerUnit

  // Calculate revenue from customer orders
  const customerDeliveries = {}
  for (const customerOrder of action.customerOrders || []) {
    const customer = levelConfig.customers?.find((c) => c.id === customerOrder.customerId)
    if (!customer) continue

    if (!customerDeliveries[customer.id]) {
      customerDeliveries[customer.id] = {
        quantity: 0,
        revenue: 0,
      }
    }

    // Only count immediate revenue (lead time = 0)
    if (customer.leadTime === 0) {
      const orderRevenue =
        customerOrder.quantity * customer.pricePerUnit - customer.transportCosts[customerOrder.quantity]
      customerDeliveries[customer.id].quantity += customerOrder.quantity
      customerDeliveries[customer.id].revenue += orderRevenue
    }
  }

  const dailyResult: DailyResult = {
    day: state.day,
    cash: state.cash,
    inventory: { ...state.inventory },
    inventoryValuation: dailyValuation,
    holdingCosts: holdingCosts,
    pattyPurchased: totalPattyPurchased,
    cheesePurchased: totalCheesePurchased,
    bunPurchased: totalBunPurchased,
    potatoPurchased: totalPotatoPurchased,
    production: action.production,
    sales: actualSales,
    revenue: revenue,
    costs: {
      purchases: totalPurchaseCost,
      production: totalProductionCost,
      holding: holdingCosts.totalHoldingCost,
      total: totalPurchaseCost + totalProductionCost + holdingCosts.totalHoldingCost + (typeof overstockResult.total === "number" ? overstockResult.total : 0),
    },
    profit: dailyProfit,
    cumulativeProfit: state.cumulativeProfit,
    score: state.score,
    deliveryOptionId: action.deliveryOptionId,
    customerDeliveries: Object.keys(customerDeliveries).length > 0 ? customerDeliveries : undefined,
    latenessPenalties: latenessPenalties.length > 0 ? latenessPenalties : undefined,
    overstockPenalty: typeof overstockResult.total === "number" ? overstockResult.total : 0,
    overstockPenaltyDetails: overstockResult.details ?? {},
  }

  state.history.push(dailyResult)
}

/**
 * Check if the game is over (reached max days)
 */
export function isGameOver(state: GameState, levelConfig: LevelConfig): boolean {
  return state.day > levelConfig.daysToComplete || state.gameOver
}

/**
 * Calculate final game result
 */
export function calculateGameResult(state: GameState, levelConfig: LevelConfig, userId: string): GameResult {
  return {
    levelId: levelConfig.id,
    userId: userId,
    finalDay: state.day,
    finalCash: state.cash,
    finalInventory: { ...state.inventory },
    cumulativeProfit: state.cumulativeProfit,
    score: state.score,
    history: [...state.history],
  }
}

/**
 * Calculate overstock penalty based on current inventory and level configuration
 */
function calculateOverstockPenalty(state: GameState, levelConfig: LevelConfig): { total: number, details: Record<string, number> } {
  if (!levelConfig.overstock) return { total: 0, details: {} }
  let totalPenalty = 0
  const details: Record<string, number> = {}
  for (const key of Object.keys(levelConfig.overstock) as Array<keyof typeof state.inventory>) {
    const rule = levelConfig.overstock[key]
    if (!rule) continue
    const inventoryAmount = state.inventory[key] || 0
    // Log here, after variables are defined
    console.log("Overstock check:", key, "inventory:", inventoryAmount, "threshold:", rule.threshold, "penaltyPerUnit:", rule.penaltyPerUnit)
    if (inventoryAmount > rule.threshold) {
      const penalty = (inventoryAmount - rule.threshold) * rule.penaltyPerUnit
      totalPenalty += penalty
      details[key] = penalty
    }
  }
  return { total: totalPenalty, details }
}
