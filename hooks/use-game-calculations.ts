"use client"

import { useMemo } from "react"
import type { GameCalculationsHook, GameCalculationsParams } from "../types/hooks"
import { PATTIES_PER_MEAL, CHEESE_PER_MEAL, BUNS_PER_MEAL, POTATOES_PER_MEAL } from "@/lib/constants"
import type { MaterialType } from "../types/game"
import { calculateHoldingCost } from "@/lib/game/calculations"

/**
 * Hook for calculating game-related values like costs, production limits, etc.
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
      const currentPurchases = gameState.cumulativePurchases[supplier.id] || {
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

  // Get the holding cost for the current inventory using level-specific costs
  const getHoldingCost = (): number => {
    return calculateHoldingCost(gameState.inventory, levelConfig)
  }

  // Calculate total cost of all actions
  const calculateTotalActionCost = (): number => {
    return calculateTotalPurchaseCost() + calculateProductionCost()
  }

  // Calculate total cost including holding costs
  const calculateTotalCost = (): number => {
    return calculateTotalActionCost() + getHoldingCost()
  }

  // Calculate maximum production based on available materials
  const calculateMaxProduction = useMemo((): number => {
    const { inventory, productionCapacity } = gameState

    // Calculate max production for each ingredient based on the requirements
    const maxProductionByPatty = Math.floor(inventory.patty / PATTIES_PER_MEAL)
    const maxProductionByCheese = Math.floor(inventory.cheese / CHEESE_PER_MEAL)
    const maxProductionByBun = Math.floor(inventory.bun / BUNS_PER_MEAL)
    const maxProductionByPotato = Math.floor(inventory.potato / POTATOES_PER_MEAL)

    // Handle edge cases where inventory might be zero
    if (inventory.patty <= 0 || inventory.cheese <= 0 || inventory.bun <= 0 || inventory.potato < POTATOES_PER_MEAL) {
      return 0
    }

    return Math.min(
      maxProductionByPatty,
      maxProductionByCheese,
      maxProductionByBun,
      maxProductionByPotato,
      productionCapacity,
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

    return noOrders && action.production === 0 && (action.salesAttempt > 0 || totalCustomerOrders > 0)
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
      return supplier?.orderQuantities || levelConfig.orderQuantities || [0, 10, 20, 30, 40, 50]
    },
    calculateTotalPurchaseCost,
    calculateProductionCost,
    getHoldingCost,
    calculateTotalActionCost,
    calculateTotalCost,
    calculateMaxProduction,
    isOnlySales,
    isNextDayButtonDisabled,
    getNextDayDisabledReason,
  }
}
