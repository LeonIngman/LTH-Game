import type {
  GameState,
  GameAction,
  LevelConfig,
  DailyResult,
  MaterialOrder,
  GameResult,
  Supplier,
  CustomerOrder,
  Customer,
  LatenessPenalty,
  InventoryValue,
  InventoryHoldingCosts,
  InventoryOverstockCosts,
} from "@/types/game"
import {
  calculateUnitCost,
  calculateHoldingCost,
  getHoldingCostBreakdown,
  addInventoryValue,
  removeInventoryValue,
  calculateOverstockCost,
  getOverstockCostBreakdown,
  calculateTransportationCost,
  PATTIES_PER_MEAL,
  CHEESE_PER_MEAL,
  BUNS_PER_MEAL,
  POTATOES_PER_MEAL
} from "@/lib/game/inventory-management"


/**
 * Initialize a new game state based on level configuration
 */
export function initializeGameState(levelConfig: LevelConfig): GameState {

  return {
    day: 1,
    cash: levelConfig.initialCash,
    inventory: { ...levelConfig.initialInventory },
    inventoryValue: {
      patty: 0,
      cheese: 0,
      bun: 0,
      potato: 0,
      finishedGoods: 0,
    },
    pendingSupplierOrders: [],
    pendingCustomerOrders: [],
    customerDeliveries: {},
    supplierDeliveries: {},
    cumulativeProfit: 0,
    score: 0,
    history: [],
    gameOver: false,
    latenessPenalties: [],
    forecastData: null,
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
  costBreakdown?: {
    purchaseCost: number
    supplierTransportCost: number
    productionCost: number
    holdingCost: number
    overstockCost: number
    restaurantDeliveryCost: number
    otherSurcharges: number
  }
} {
  // Calculate total purchase cost
  let totalPurchaseCost = 0

  // Process orders from each supplier
  for (const order of action.supplierOrders) {
    const supplier = levelConfig.suppliers.find((s) => s.id === order.supplierId)
    if (!supplier) continue

    // Calculate cost for each material
    if (order.pattyPurchase > 0) {
      const unitCost = calculateUnitCost(order.pattyPurchase, "patty", supplier)
      totalPurchaseCost += order.pattyPurchase * unitCost
    }

    if (order.cheesePurchase > 0) {
      const unitCost = calculateUnitCost(order.cheesePurchase, "cheese", supplier)
      totalPurchaseCost += order.cheesePurchase * unitCost
    }

    if (order.bunPurchase > 0) {
      const unitCost = calculateUnitCost(order.bunPurchase, "bun", supplier)
      totalPurchaseCost += order.bunPurchase * unitCost
    }

    if (order.potatoPurchase > 0) {
      const unitCost = calculateUnitCost(order.potatoPurchase, "potato", supplier)
      totalPurchaseCost += order.potatoPurchase * unitCost
    }
  }

  // Calculate pure material purchase cost (without transport)
  let purePurchaseCost = 0
  for (const order of action.supplierOrders) {
    const supplier = levelConfig.suppliers.find((s) => s.id === order.supplierId)
    if (!supplier?.materialPrices) continue

    if (order.pattyPurchase > 0) {
      purePurchaseCost += order.pattyPurchase * supplier.materialPrices.patty
    }
    if (order.cheesePurchase > 0) {
      purePurchaseCost += order.cheesePurchase * supplier.materialPrices.cheese
    }
    if (order.bunPurchase > 0) {
      purePurchaseCost += order.bunPurchase * supplier.materialPrices.bun
    }
    if (order.potatoPurchase > 0) {
      purePurchaseCost += order.potatoPurchase * supplier.materialPrices.potato
    }
  }

  // Calculate production cost
  const productionCost = action.production * levelConfig.productionCostPerUnit

  // Calculate transportation cost
  const transportationCost = calculateTransportationCost(action, levelConfig)

  // Calculate supplier transport cost (difference between total and pure purchase)
  const supplierTransportCost = totalPurchaseCost - purePurchaseCost

  // Calculate total action cost
  const totalActionCost = totalPurchaseCost + productionCost + transportationCost

  // Calculate holding cost
  const holdingCost = calculateHoldingCost(gameState)

  // Calculate overstock cost
  const overstockCost = calculateOverstockCost(gameState, levelConfig)

  // Calculate restaurant delivery cost (transportation cost from our calculation)
  const restaurantDeliveryCost = transportationCost

  // Other surcharges (none currently in the system)
  const otherSurcharges = 0

  // Calculate total cost
  const totalCost = totalActionCost + holdingCost + overstockCost

  // Create cost breakdown for debug purposes
  const costBreakdown = {
    purchaseCost: Number(purePurchaseCost.toFixed(2)),
    supplierTransportCost: Number(supplierTransportCost.toFixed(2)),
    productionCost: Number(productionCost.toFixed(2)),
    holdingCost: Number(holdingCost.toFixed(2)),
    overstockCost: Number(overstockCost.toFixed(2)),
    restaurantDeliveryCost: Number(restaurantDeliveryCost.toFixed(2)),
    otherSurcharges: Number(otherSurcharges.toFixed(2))
  }

  // Check if player has enough cash
  if (totalCost > gameState.cash) {
    return {
      valid: false,
      message: `Insufficient funds. Total cost: ${totalCost.toFixed(2)} kr, Available cash: ${gameState.cash.toFixed(2)} kr`,
      totalCost,
      holdingCost,
      availableCash: gameState.cash,
      costBreakdown
    }
  }

  return {
    valid: true,
    totalCost,
    holdingCost,
    availableCash: gameState.cash,
    costBreakdown
  }
}

/**
 * Check for missed customer milestones and calculate penalties.
 * Returns an array of penalties for each missed delivery milestone for all customers.
 */
function checkMissedMilestones(state: GameState, levelConfig: LevelConfig): LatenessPenalty[] {
  const penalties: LatenessPenalty[] = []

  // Skip if no customers
  if (!levelConfig.customers || levelConfig.customers.length === 0) {
    return penalties
  }

  // Check each customer's delivery schedule
  for (const customer of levelConfig.customers) {

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
 * Process production: updates cash and inventory based on production actions.
 */
function processProduction(state: GameState, action: GameAction, levelConfig: LevelConfig): void {
  if (action.production <= 0) return

  // Determine production amount - use forecasted production if available
  let targetProduction = action.production

  // Check if we have forecasted production rates for this day
  if (state.forecastData?.productionRates && state.forecastData.productionRates[state.day]) {
    targetProduction = state.forecastData.productionRates[state.day]
  }

  if (targetProduction <= 0) return

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
    targetProduction,
  )

  if (maxProduction > 0) {
    // Calculate production cost
    const productionCost = maxProduction * levelConfig.productionCostPerUnit

    // Remove materials and decrease their inventory values
    removeInventoryValue(state, "patty", maxProduction * PATTIES_PER_MEAL)
    removeInventoryValue(state, "cheese", maxProduction * CHEESE_PER_MEAL)
    removeInventoryValue(state, "bun", maxProduction * BUNS_PER_MEAL)
    removeInventoryValue(state, "potato", maxProduction * POTATOES_PER_MEAL)

    // Add to finished goods with value
    addInventoryValue(state, "finishedGoods", maxProduction, productionCost)

    // Deduct production cost from cash
    state.cash = Number.parseFloat((state.cash - productionCost).toFixed(2))
  }
}

/**
 * Main game loop: processes a single day of gameplay based on player actions.
 * Returns the updated game state after all actions and events are processed.
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
    customerOrders: action.customerOrders || [],
  }

  // 1. Process pending orders (materials arriving)
  processPendingSupplierOrders(newState)

  // 2. Process pending customer orders (revenue from previous days)
  processPendingCustomerOrders(newState)

  // 3. Process new purchases
  processPurchases(newState, action, levelConfig)

  // 4. Process production
  processProduction(newState, action, levelConfig)

  // 5. Process new sales
  processSales(newState, action, levelConfig)

  // 6. Check for missed milestones and apply penalties
  const latenessPenalties = checkMissedMilestones(newState, levelConfig)

  // Add penalties to state
  if (latenessPenalties.length > 0) {
    if (!newState.latenessPenalties) {
      newState.latenessPenalties = []
    }
    newState.latenessPenalties = [...newState.latenessPenalties, ...latenessPenalties]
  }

  // 7. Calculate holding costs
  const baseHoldingCost = calculateHoldingCost(newState)
  const baseHoldingCostBreakdown = getHoldingCostBreakdown(newState)
  const overstockCost = calculateOverstockCost(newState, levelConfig)
  const overstockBreakdown = getOverstockCostBreakdown(newState, levelConfig)

  // 8. Deduct holding costs
  newState.cash = Number.parseFloat((newState.cash - baseHoldingCost - overstockCost).toFixed(2))

  // 9. Calculate daily profit and update cumulative profit
  const dailyProfit = newState.cash - initialCash
  newState.cumulativeProfit += dailyProfit

  // 10. Calculate score
  newState.score = calculateScore(newState, levelConfig)

  // 11. Record daily results in history
  recordDailyResults(newState, action, dailyProfit, levelConfig, baseHoldingCostBreakdown, overstockBreakdown, latenessPenalties)

  // 12. Check if player is bankrupt (cash <= 0)
  if (newState.cash <= 0 && !canRecoverFromZeroCash(newState)) {
    newState.gameOver = true
    // Game over: Player is bankrupt with cash: newState.cash
  }

  // 13. Advance to next day (only if not game over)
  if (!newState.gameOver) {
    newState.day += 1
  }

  return newState
}

/**
 * Check if player can recover from zero cash.
 * Returns true if the player has finished goods to sell, allowing recovery.
 */
function canRecoverFromZeroCash(state: GameState): boolean {
  return state.inventory.finishedGoods > 0
}

/**
 * Process any pending supplier orders that are due to arrive today.
 */
function processPendingSupplierOrders(state: GameState): void {
  const arrivingOrders: MaterialOrder[] = []
  const remainingOrders: MaterialOrder[] = []

  const pendingOrders = state.pendingSupplierOrders ?? []
  for (const order of state.pendingSupplierOrders) {
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
    // Add to inventory with value
    addInventoryValue(
      state,
      order.materialType,
      order.quantity,
      order.totalCost
    )
  }

  state.pendingSupplierOrders = remainingOrders
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
 * Get random lead time for suppliers/customers with random lead times,
 * otherwise fixed lead time
 */
function getRandomLeadTime(entity: Supplier | Customer): number {
  if (entity.randomLeadTime && entity.leadTimeRange) {
    const randomIndex = Math.floor(Math.random() * entity.leadTimeRange.length)
    return entity.leadTimeRange[randomIndex]
  }
  return entity.leadTime
}

/**
 * Process purchases and keep track of cumulative purchases, update cash and inventory value,
 * and push to pending orders
 */
function processPurchases(state: GameState, action: GameAction, levelConfig: LevelConfig): void {

  // Process orders from each supplier
  for (const order of action.supplierOrders) {
    const supplier = getSupplier(order.supplierId, levelConfig)
    if (!supplier) continue

    const supplierName = supplier.name

    // Get lead time
    const leadTime = getRandomLeadTime(supplier)

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
        const unitCost = calculateUnitCost(material.quantity, material.type, supplier)
        const totalCost = material.quantity * unitCost

        // Deduct cost from cash
        state.cash = Number.parseFloat((state.cash - totalCost).toFixed(2))

        // Add to inventory value
        state.inventoryValue[material.type] += totalCost

        // Always update deliveredSoFar immediately
        if (!state.supplierDeliveries[order.supplierId]) state.supplierDeliveries[order.supplierId] = {}
        state.supplierDeliveries[order.supplierId][material.type] =
          (state.supplierDeliveries[order.supplierId][material.type] || 0) + material.quantity

        if (leadTime === 0) {
          // Add directly to inventory with value
          addInventoryValue(state, material.type, material.quantity, totalCost)
        } else {
          // Add to pending orders with lead time
          state.pendingSupplierOrders.push({
            materialType: material.type,
            quantity: material.quantity,
            daysRemaining: leadTime,
            totalCost: totalCost,
            supplierId: order.supplierId,
            supplierName: supplierName,
            actualLeadTime: leadTime,
          })
        }
      }
    }
  }
}

/**
 * Process sales and update cash and inventory value,
 * and push to pending orders
 */
function processSales(state: GameState, action: GameAction, levelConfig: LevelConfig): void {
  // Process each customer order
  for (const customerOrder of action.customerOrders || []) {
    const customer = getCustomer(customerOrder.customerId, levelConfig)
    if (!customer) continue

    // Check if we have enough inventory
    if (customerOrder.quantity > state.inventory.finishedGoods) {
      continue // Skip this order if not enough inventory
    }

    // Check if the order quantity is valid
    if (!customer.allowedShipmentSizes.includes(customerOrder.quantity)) {
      continue // Skip if not an allowed shipment size
    }

    // Remove from inventory with value
    removeInventoryValue(state, "finishedGoods", customerOrder.quantity)

    // Calculate revenue and transport cost
    const revenue = customerOrder.quantity * customer.pricePerUnit
    const transportCost = customer.transportCosts[customerOrder.quantity] || 0
    const netRevenue = revenue - transportCost

    // Get lead time
    const leadTime = getRandomLeadTime(customer)

    // If lead time is 0, add revenue immediately
    if (leadTime === 0) {
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
        daysRemaining: leadTime,
        totalRevenue: revenue,
        transportCost: transportCost,
        netRevenue: netRevenue,
        actualLeadTime: leadTime,
      })
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
  holdingCosts: InventoryHoldingCosts,
  overstockCosts: InventoryOverstockCosts,
  latenessPenalties: LatenessPenalty[],
): void {
  // Calculate total purchases from all suppliers
  let totalPattyPurchased = 0
  let totalCheesePurchased = 0
  let totalBunPurchased = 0
  let totalPotatoPurchased = 0
  let totalPurchaseCost = 0

  for (const order of action.supplierOrders) {
    const supplier = levelConfig.suppliers.find((s) => s.id === order.supplierId)
    if (!supplier) continue

    totalPattyPurchased += order.pattyPurchase
    totalCheesePurchased += order.cheesePurchase
    totalBunPurchased += order.bunPurchase
    totalPotatoPurchased += order.potatoPurchase

    // Calculate purchase costs
    if (order.pattyPurchase > 0) {
      const unitCost = calculateUnitCost(order.pattyPurchase, "patty", supplier)
      totalPurchaseCost += order.pattyPurchase * unitCost
    }
    if (order.cheesePurchase > 0) {
      const unitCost = calculateUnitCost(order.cheesePurchase, "cheese", supplier)
      totalPurchaseCost += order.cheesePurchase * unitCost
    }
    if (order.bunPurchase > 0) {
      const unitCost = calculateUnitCost(order.bunPurchase, "bun", supplier)
      totalPurchaseCost += order.bunPurchase * unitCost
    }
    if (order.potatoPurchase > 0) {
      const unitCost = calculateUnitCost(order.potatoPurchase, "potato", supplier)
      totalPurchaseCost += order.potatoPurchase * unitCost
    }
  }

  // Calculate actual production (use forecasted if available)
  let actualProduction = action.production
  if (state.forecastData?.productionRates && state.forecastData.productionRates[state.day - 1]) {
    // Use previous day's production since we've already advanced the day
    const targetProduction = state.forecastData.productionRates[state.day - 1]

    // Calculate what was actually produced based on inventory constraints
    const maxProductionByPatty = Math.floor((state.inventory.patty + totalPattyPurchased) / 1)
    const maxProductionByCheese = Math.floor((state.inventory.cheese + totalCheesePurchased) / 1)
    const maxProductionByBun = Math.floor((state.inventory.bun + totalBunPurchased) / 1)
    const maxProductionByPotato = Math.floor((state.inventory.potato + totalPotatoPurchased) / 1)

    actualProduction = Math.min(
      maxProductionByPatty,
      maxProductionByCheese,
      maxProductionByBun,
      maxProductionByPotato,
      targetProduction,
    )
  }

  // Calculate production cost
  const totalProductionCost = actualProduction * levelConfig.productionCostPerUnit

  // Calculate sales quantity
  const actualSales = state.inventory.finishedGoods + actualProduction

  // Calculate holding costs
  const baseHoldingCost = Object.values(holdingCosts).reduce((sum, value) => sum + value, 0);
  const overstockCost = Object.values(overstockCosts).reduce((sum, value) => sum + value, 0);
  const totalHoldingCost = baseHoldingCost + overstockCost

  // Calculate revenue from customer orders
  const customerDeliveries: Record<number, { quantity: number; revenue: number }> = {}
  let revenue = 0
  let totalTransportCost = 0

  for (const customerOrder of action.customerOrders || []) {
    const customer = levelConfig.customers?.find((c) => c.id === customerOrder.customerId)

    if (!customer) continue

    if (!customerDeliveries[customer.id]) {
      customerDeliveries[customer.id] = {
        quantity: 0,
        revenue: 0,
      }
    }

    // Skip orders with zero quantity to avoid NaN issues
    if (customerOrder.quantity <= 0) {
      continue
    }

    const transportCost = customer.transportCosts[customerOrder.quantity] || 0
    // Revenue = gross sales value (no costs subtracted)
    const orderRevenue = customerOrder.quantity * customer.pricePerUnit

    customerDeliveries[customer.id].quantity += customerOrder.quantity
    customerDeliveries[customer.id].revenue += orderRevenue
    revenue += orderRevenue
    totalTransportCost += transportCost
  }

  // Ensure revenue is never NaN - treat as 0 if corrupted
  if (isNaN(revenue)) {
    revenue = 0
  }

  // Calculate proper profit: Revenue - Total Costs  
  const totalCosts = totalPurchaseCost + totalProductionCost + totalHoldingCost + totalTransportCost
  const calculatedProfit = revenue - totalCosts

  const dailyResult: DailyResult = {
    day: state.day,
    cash: state.cash,
    inventory: { ...state.inventory },
    inventoryValue: { ...state.inventoryValue },
    holdingCosts: holdingCosts,
    overstockCosts: overstockCosts,
    pattyPurchased: totalPattyPurchased,
    cheesePurchased: totalCheesePurchased,
    bunPurchased: totalBunPurchased,
    potatoPurchased: totalPotatoPurchased,
    production: actualProduction,
    sales: actualSales,
    revenue: revenue,
    costs: {
      purchases: totalPurchaseCost,
      production: totalProductionCost,
      holding: totalHoldingCost,
      transport: totalTransportCost,
      total: totalPurchaseCost + totalProductionCost + totalHoldingCost + totalTransportCost,
    },
    profit: calculatedProfit,
    cumulativeProfit: state.cumulativeProfit,
    score: state.score,
    customerDeliveries: Object.keys(customerDeliveries).length > 0 ? customerDeliveries : undefined,
    latenessPenalties: latenessPenalties.length > 0 ? latenessPenalties : undefined,
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
