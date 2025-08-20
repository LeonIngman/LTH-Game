"use client"

import {
  PATTIES_PER_MEAL,
  CHEESE_PER_MEAL,
  BUNS_PER_MEAL,
  POTATOES_PER_MEAL,
  calculateHoldingCost,
  calculateOverstockCost,
  calculateUnitCost
} from "@/lib/game/inventory-management"

import { useMemo } from "react"
import type { GameCalculationsHook, GameCalculationsParams } from "../types/hooks"
import type { MaterialType } from "../types/game"

/**
 * Hook for calculating inventory-related values
 */
export function useGameCalculations({
  gameState,
  levelConfig,
  supplierOrders,
  action,
}: GameCalculationsParams): GameCalculationsHook {
  // Get material price for a specific supplier
  const getMaterialPriceForSupplier = (supplierId: number, materialType: MaterialType): number => {
    try {
      // Add null checks to prevent errors
      if (!supplierId || !materialType || !levelConfig || !levelConfig.suppliers) {
        console.warn(
          `Missing required data for price calculation: supplierId=${supplierId}, materialType=${materialType}`,
        )
        return 0
      }

      const supplier = levelConfig.suppliers.find((s) => s.id === supplierId)
      if (!supplier) {
        console.warn(`Supplier with ID ${supplierId} not found`)
        return 0
      }

      // If supplier has specific material prices, use those
      if (supplier.materialPrices && typeof supplier.materialPrices[materialType] === "number") {
        return supplier.materialPrices[materialType]
      }

      return 0
    } catch (error) {
      console.error(`Error in getMaterialPriceForSupplier:`, error)
      return 0 // Return a safe default value
    }
  }

  // Validate the supplier has non-negative remaining capacity
  const validateSupplierCapacity = (): { valid: boolean; message?: string } => {
    for (const order of supplierOrders) {
      const supplier = levelConfig.suppliers.find((s) => s.id === order.supplierId)
      if (!supplier || typeof supplier.capacityPerGame !== "object") continue

      // Initialize if not exists
      const currentPurchases = gameState.supplierDeliveries[supplier.id] || {
        patty: 0, cheese: 0, bun: 0, potato: 0
      }

      // Check each material
      const materials = [
        { type: "patty", current: currentPurchases.patty, newOrder: order.pattyPurchase },
        { type: "cheese", current: currentPurchases.cheese, newOrder: order.cheesePurchase },
        { type: "bun", current: currentPurchases.bun, newOrder: order.bunPurchase },
        { type: "potato", current: currentPurchases.potato, newOrder: order.potatoPurchase },
      ]

      for (const material of materials) {
        if (material.newOrder > 0) {
          const newTotal = material.current + material.newOrder
          const capacity = supplier.capacityPerGame[material.type] || 0

          if (newTotal > capacity) {
            return {
              valid: false,
              message: `${supplier.name}: ${material.type} order would exceed game capacity (${newTotal}/${capacity})`
            }
          }
        }
      }
    }

    return { valid: true }
  }

  // Calculate base cost for a material (price * quantity)
  const calculateBaseCost = (quantity: number, supplierId: number, materialType: MaterialType): number => {
    try {
      // Ensure we have valid inputs
      if (quantity <= 0 || !supplierId || !materialType) return 0

      const supplier = levelConfig.suppliers.find((s) => s.id === supplierId)
      if (!supplier) return 0

      // Get the price per unit
      const pricePerUnit = getMaterialPriceForSupplier(supplierId, materialType)

      // Check if price is valid
      if (typeof pricePerUnit !== "number" || isNaN(pricePerUnit)) return 0

      // Calculate base cost
      return Math.round(quantity * pricePerUnit * 100) / 100
    } catch (error) {
      console.error(`Error calculating base cost for ${materialType} from supplier ${supplierId}:`, error)
      return 0
    }
  }

  // Calculate shipment cost for a material
  const calculateShipmentCost = (quantity: number, supplierId: number, materialType: MaterialType): number => {
    try {
      // Ensure we have valid inputs
      if (quantity <= 0 || !supplierId || !materialType) return 0

      const supplier = levelConfig.suppliers.find((s) => s.id === supplierId)
      if (!supplier) return 0

      // Check if supplier has special shipment prices
      if (
        supplier.shipmentPrices &&
        supplier.shipmentPrices[materialType] &&
        supplier.shipmentPrices[materialType][quantity]
      ) {
        return supplier.shipmentPrices[materialType][quantity]
      }

      // If no special shipment prices, return 0 (base cost only)
      return 0
    } catch (error) {
      console.error(`Error calculating shipment cost for ${materialType} from supplier ${supplierId}:`, error)
      return 0
    }
  }

  // Calculate total cost (base + shipment) for a material
  const calculateMaterialTotalCost = (quantity: number, supplierId: number, materialType: MaterialType): number => {
    try {
      // Ensure we have valid inputs
      if (quantity <= 0 || !supplierId || !materialType) return 0

      const supplier = levelConfig.suppliers.find((s) => s.id === supplierId)
      if (!supplier) return 0

      // Check if supplier has shipment prices
      if (
        supplier.shipmentPrices &&
        supplier.shipmentPrices[materialType] &&
        supplier.shipmentPrices[materialType][quantity]
      ) {
        // Add base cost and shipment cost
        const baseCost = calculateBaseCost(quantity, supplierId, materialType)
        return baseCost + supplier.shipmentPrices[materialType][quantity]
      }

      // If no special shipment prices, calculate with delivery multiplier
      const baseCost = calculateBaseCost(quantity, supplierId, materialType)
      return Math.round(baseCost)
    } catch (error) {
      console.error(`Error calculating total cost for ${materialType} from supplier ${supplierId}:`, error)
      return 0
    }
  }

  // Calculate total purchase cost across all suppliers
  const calculateTotalPurchaseCost = (): number => {
    return supplierOrders.reduce((totalCost, order) => {
      const supplier = levelConfig.suppliers.find((s) => s.id === order.supplierId)
      if (!supplier) return totalCost

      let orderTotal = 0

      // Calculate total for each material
      if (order.pattyPurchase > 0) {
        orderTotal += calculateMaterialTotalCost(order.pattyPurchase, order.supplierId, "patty")
      }
      if (order.cheesePurchase > 0) {
        orderTotal += calculateMaterialTotalCost(order.cheesePurchase, order.supplierId, "cheese")
      }
      if (order.bunPurchase > 0) {
        orderTotal += calculateMaterialTotalCost(order.bunPurchase, order.supplierId, "bun")
      }
      if (order.potatoPurchase > 0) {
        orderTotal += calculateMaterialTotalCost(order.potatoPurchase, order.supplierId, "potato")
      }

      return totalCost + orderTotal
    }, 0)
  }

  // Calculate production cost
  const calculateProductionCost = (): number => {
    return action.production * (levelConfig.productionCostPerUnit || 4) // Default to 4 if not specified
  }

  // Helper function to process pending supplier orders arriving today
  const processPendingDeliveries = (projectedInventoryValue: Record<string, number>): void => {
    if (gameState.pendingSupplierOrders) {
      for (const pendingOrder of gameState.pendingSupplierOrders) {
        if (pendingOrder.daysRemaining === 0) {
          // This order delivers today, add its value to inventory
          projectedInventoryValue[pendingOrder.materialType] += pendingOrder.totalCost
        }
      }
    }
  }

  // Helper function to add immediate purchase values (leadTime = 0 only)
  const addImmediatePurchases = (projectedInventoryValue: Record<string, number>): void => {
    for (const order of supplierOrders) {
      const supplier = levelConfig.suppliers.find((s) => s.id === order.supplierId)
      if (!supplier) continue

      // Only add purchases that deliver immediately (leadTime = 0)
      const leadTime = supplier.leadTime || 0
      if (leadTime > 0) continue // Skip orders with lead time - they won't arrive today

      // Add each material purchase using engine's UnitCost calculation
      if (order.pattyPurchase > 0) {
        const unitCost = calculateUnitCost(order.pattyPurchase, "patty", supplier)
        projectedInventoryValue.patty += order.pattyPurchase * unitCost
      }
      if (order.cheesePurchase > 0) {
        const unitCost = calculateUnitCost(order.cheesePurchase, "cheese", supplier)
        projectedInventoryValue.cheese += order.cheesePurchase * unitCost
      }
      if (order.bunPurchase > 0) {
        const unitCost = calculateUnitCost(order.bunPurchase, "bun", supplier)
        projectedInventoryValue.bun += order.bunPurchase * unitCost
      }
      if (order.potatoPurchase > 0) {
        const unitCost = calculateUnitCost(order.potatoPurchase, "potato", supplier)
        projectedInventoryValue.potato += order.potatoPurchase * unitCost
      }
    }
  }

  // Helper function to process production (remove materials, add finished goods)
  const processProduction = (projectedInventoryValue: Record<string, number>): void => {
    if (action.production > 0) {
      // Calculate material consumption
      const pattiesUsed = action.production * PATTIES_PER_MEAL
      const cheeseUsed = action.production * CHEESE_PER_MEAL
      const bunsUsed = action.production * BUNS_PER_MEAL
      const potatoesUsed = action.production * POTATOES_PER_MEAL

      // Calculate projected inventory quantities after purchases
      const projectedPattyQuantity = gameState.inventory.patty + supplierOrders.reduce((sum, order) => {
        const supplier = levelConfig.suppliers.find((s) => s.id === order.supplierId)
        return sum + (supplier && supplier.leadTime === 0 ? order.pattyPurchase : 0)
      }, 0)
      const projectedCheeseQuantity = gameState.inventory.cheese + supplierOrders.reduce((sum, order) => {
        const supplier = levelConfig.suppliers.find((s) => s.id === order.supplierId)
        return sum + (supplier && supplier.leadTime === 0 ? order.cheesePurchase : 0)
      }, 0)
      const projectedBunQuantity = gameState.inventory.bun + supplierOrders.reduce((sum, order) => {
        const supplier = levelConfig.suppliers.find((s) => s.id === order.supplierId)
        return sum + (supplier && supplier.leadTime === 0 ? order.bunPurchase : 0)
      }, 0)
      const projectedPotatoQuantity = gameState.inventory.potato + supplierOrders.reduce((sum, order) => {
        const supplier = levelConfig.suppliers.find((s) => s.id === order.supplierId)
        return sum + (supplier && supplier.leadTime === 0 ? order.potatoPurchase : 0)
      }, 0)

      // Calculate average cost per unit (FIFO like engine)
      const pattyAvgCost = projectedInventoryValue.patty / Math.max(1, projectedPattyQuantity)
      const cheeseAvgCost = projectedInventoryValue.cheese / Math.max(1, projectedCheeseQuantity)
      const bunAvgCost = projectedInventoryValue.bun / Math.max(1, projectedBunQuantity)
      const potatoAvgCost = projectedInventoryValue.potato / Math.max(1, projectedPotatoQuantity)

      // Remove material values consumed in production
      projectedInventoryValue.patty = Math.max(0, projectedInventoryValue.patty - (pattiesUsed * pattyAvgCost))
      projectedInventoryValue.cheese = Math.max(0, projectedInventoryValue.cheese - (cheeseUsed * cheeseAvgCost))
      projectedInventoryValue.bun = Math.max(0, projectedInventoryValue.bun - (bunsUsed * bunAvgCost))
      projectedInventoryValue.potato = Math.max(0, projectedInventoryValue.potato - (potatoesUsed * potatoAvgCost))

      // Add finished goods value (ONLY production cost, materials are consumed/lost)
      const productionCost = action.production * (levelConfig.productionCostPerUnit || 4)
      projectedInventoryValue.finishedGoods += productionCost
    }
  }

  // Helper function to process sales (remove finished goods values)
  const processSales = (projectedInventoryValue: Record<string, number>): void => {
    if (action.customerOrders) {
      for (const customerOrder of action.customerOrders) {
        if (customerOrder.quantity > 0) {
          // Calculate projected finished goods quantity after production
          const projectedFinishedQuantity = gameState.inventory.finishedGoods + (action.production || 0)

          // Calculate average cost per finished good
          const finishedGoodsAvgCost = projectedInventoryValue.finishedGoods / Math.max(1, projectedFinishedQuantity)

          // Remove sold finished goods value
          const quantitySold = Math.min(customerOrder.quantity, projectedFinishedQuantity)
          projectedInventoryValue.finishedGoods = Math.max(0, projectedInventoryValue.finishedGoods - (quantitySold * finishedGoodsAvgCost))
        }
      }
    }
  }

  /**
   * Calculate projected holding cost to match the game engine's exact calculation.
   * 
   * This function simulates the exact sequence and calculations used by the game engine
   * to provide accurate preview of holding costs that will be applied when the day is processed.
   * 
   * @returns {number} The total projected holding cost in kr
   * 
   * ## Purpose:
   * - Provides real-time preview of holding costs for planning decisions
   * - Ensures frontend preview matches backend engine calculations exactly
   * - Calculates holding cost on inventory values after all planned actions are processed
   * - **LEAD TIME AWARE**: Only includes deliveries that arrive today, not future pending orders
   * 
   * ## Engine Sequence Simulation:
   * 1. Start with current inventory values
   * 2. Process pending supplier orders that arrive today (daysRemaining = 0)
   * 3. Add purchase values for orders with 0 lead time only (immediate delivery)
   * 4. Process production: remove material values using FIFO average cost, add finished goods
   * 5. Process sales: remove finished goods values using FIFO average cost
   * 6. Calculate holding cost on resulting inventory values
   * 
   * ## Key Features:
   * - **Lead Time Accuracy**: Orders with lead time > 0 don't affect today's inventory
   * - **Transport Cost Inclusion**: Uses calculateUnitCost() which includes shipment costs
   * - **FIFO Average Costing**: Removes inventory values using weighted average cost
   * - **Engine Parity**: Matches the exact calculation sequence used in lib/game/engine.ts
   * - **Real-time Updates**: Recalculates as user changes orders/production
   * 
   * ## Formula:
   * ```
   * HoldingCost = (0.25 / 365) * ProjectedInventoryValue
   * 
   * Where ProjectedInventoryValue = 
   *   CurrentInventoryValue +
   *   PendingDeliveriesToday +
   *   ImmediatePurchases - 
   *   ProductionRemovals +
   *   ProductionAdditions -
   *   SalesRemovals
   * ```
   * 
   * ## Example Scenario:
   * ```
   * Current: 50 patties worth 150kr, 0 finished goods
   * Planned: Buy 20 patties from 3-day supplier at 4kr/unit, Produce 30 meals, Sell 0
   * 
   * Step 1: No pending deliveries today
   * Step 2: Skip purchase (3-day lead time, won't arrive today)
   * Step 3: Production removes: 30 patties at avg cost (150kr/50 patties) = 90kr
   * Step 4: Production adds: 30 meals worth (90kr materials + 120kr production) = 210kr
   * Step 5: No sales
   * Result: 60kr patty + 210kr finished = 270kr total
   * HoldingCost: (0.25/365) * 270kr = 0.18kr
   * ```
   * 
   * ## Edge Cases Handled:
   * - **Empty Inventory**: Returns 0 when no inventory exists
   * - **Insufficient Materials**: Production limited by available materials
   * - **Zero Division**: Uses Math.max(1, quantity) to prevent division by zero
   * - **Negative Values**: Uses Math.max(0, value) to prevent negative inventory values
   * - **No Orders**: Returns holding cost for current inventory when no actions planned
   * - **Lead Times**: Only immediate deliveries (leadTime = 0) affect today's holding cost
   * 
   * ## Dependencies:
   * - calculateUnitCost() from inventory-management.ts (includes transport costs)
   * - calculateHoldingCost() from inventory-management.ts (applies 25% annual rate)
   * - Material consumption constants (PATTIES_PER_MEAL, etc.)
   * 
   * ## Maintenance Notes:
   * - Must stay synchronized with engine calculation logic in lib/game/engine.ts
   * - Update if material consumption ratios change
   * - Update if holding cost rate changes from 25% annual
   * - Test with edge cases when modifying
   */
  const getHoldingCost = (): number => {
    // Start with current inventory values (deep clone to avoid mutation)
    const projectedInventoryValue = { ...gameState.inventoryValue }

    // === STEP 1: PROCESS PENDING SUPPLIER ORDERS ARRIVING TODAY ===
    processPendingDeliveries(projectedInventoryValue)

    // === STEP 2: ADD PURCHASE VALUES (ONLY for immediate delivery, leadTime = 0) ===
    addImmediatePurchases(projectedInventoryValue)

    // === STEP 3: PROCESS PRODUCTION (remove materials, add finished goods) ===
    processProduction(projectedInventoryValue)

    // === STEP 4: PROCESS SALES (remove finished goods values) ===
    processSales(projectedInventoryValue)

    // === STEP 5: CALCULATE HOLDING COST (same as engine) ===
    const projectedGameState = {
      ...gameState,
      inventoryValue: projectedInventoryValue
    }

    return calculateHoldingCost(projectedGameState)
  }

  // Get the overstock cost for the current inventory using level-specific costs
  const getOverstockCost = (): number => {
    return calculateOverstockCost(gameState, levelConfig)
  }

  // Calculate total cost of all actions
  const calculateTotalActionCost = (): number => {
    return calculateTotalPurchaseCost() + calculateProductionCost()
  }

  // Calculate total cost including holding costs and overstock costs
  const calculateTotalCost = (): number => {
    return calculateTotalActionCost() + getHoldingCost() + getOverstockCost()
  }

  // Calculate maximum production based on available materials
  const calculateMaxProduction = useMemo((): number => {
    const inventory = gameState.inventory

    // Calculate max production for each ingredient based on the requirements
    const maxProductionByPatty = Math.floor(inventory.patty / PATTIES_PER_MEAL)
    const maxProductionByCheese = Math.floor(inventory.cheese / CHEESE_PER_MEAL)
    const maxProductionByBun = Math.floor(inventory.bun / BUNS_PER_MEAL)
    const maxProductionByPotato = Math.floor(inventory.potato / POTATOES_PER_MEAL)

    return Math.min(
      maxProductionByPatty,
      maxProductionByCheese,
      maxProductionByBun,
      maxProductionByPotato,
    )
  }, [gameState.inventory, gameState])

  // Check if the player is only attempting sales (no purchases or production)
  const isOnlySales = (): boolean => {
    const noOrders = supplierOrders.every(
      (order) =>
        order.pattyPurchase === 0 &&
        order.cheesePurchase === 0 &&
        order.bunPurchase === 0 &&
        order.potatoPurchase === 0,
    )

    const totalCustomerOrders = action.customerOrders?.reduce((total, order) => total + order.quantity, 0) || 0

    return noOrders && action.production === 0 && (totalCustomerOrders > 0)
  }

  // Determine if the Next Day button should be disabled
  const isNextDayButtonDisabled = (): boolean => {
    // Affordability check
    if (gameState.cash === 0 && isOnlySales()) return false
    if (calculateTotalCost() > gameState.cash) return true

    // Capacity validation
    const capacityCheck = validateSupplierCapacity()
    if (!capacityCheck.valid) return true

    return false
  }

  // Determine why the Next Day button is disabled
  const getNextDayDisabledReason = (): string => {
    // Check if total purchases exceed supplier capacity
    const capacityCheck = validateSupplierCapacity()
    if (!capacityCheck.valid) {
      return capacityCheck.message || "Exceeds supplier capacity"
    }

    // Check if player can afford actions
    const totalCost = calculateTotalCost()
    if (totalCost > gameState.cash) {
      const shortfall = (totalCost - gameState.cash).toFixed(2)
      return `Insufficient funds. You need ${shortfall} kr more to proceed`
    }

    return "Button is disabled"
  }

  return {
    getMaterialPriceForSupplier,
    getOrderQuantitiesForSupplier: (supplierId) => {
      const supplier = levelConfig.suppliers.find((s) => s.id === supplierId)
      // Return shipment prices keys if available, otherwise default quantities
      if (supplier?.shipmentPrices) {
        const allQuantities = new Set<number>()
        Object.values(supplier.shipmentPrices).forEach(priceMap => {
          Object.keys(priceMap).forEach(qty => allQuantities.add(Number(qty)))
        })
        if (allQuantities.size > 0) {
          return [0, ...Array.from(allQuantities).sort((a, b) => a - b)]
        }
      }
      return [0, 10, 20, 30, 40, 50]
    },
    calculateTotalPurchaseCost,
    calculateProductionCost,
    getHoldingCost,
    getOverstockCost,
    calculateTotalActionCost,
    calculateTotalCost,
    calculateMaxProduction,
    isOnlySales,
    isNextDayButtonDisabled,
    getNextDayDisabledReason,
  }
}
