"use client"

import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { GameState, LevelConfig, GameAction, SupplierOrder } from "@/types/game"
import { calculateDailyInventoryValuation, calculateInventoryHoldingCosts } from "@/lib/game/inventory-management"

interface CostSummaryProps {
  gameState: GameState
  levelConfig: LevelConfig
  action: GameAction
  supplierOrders: SupplierOrder[]
  isLoading: boolean
  gameEnded: boolean
  onProcessDay: () => void
  onShowChart: () => void
  onShowTutorial: () => void
  calculateTotalPurchaseCost: () => number
  calculateProductionCost: () => number
  getHoldingCost: () => number
  calculateTotalCost: () => number
  isNextDayButtonDisabled: () => boolean
  getNextDayDisabledReason: () => string
}

export function CostSummary({
  gameState,
  levelConfig,
  action,
  supplierOrders,
  isLoading,
  gameEnded,
  onProcessDay,
  calculateTotalPurchaseCost,
  calculateProductionCost,
  getHoldingCost,
  calculateTotalCost,
  isNextDayButtonDisabled,
  getNextDayDisabledReason,
}: CostSummaryProps) {
  // Calculate individual cost components
  const purchaseCost = calculateTotalPurchaseCost()
  const productionCost = calculateProductionCost()

  // Calculate transportation cost as the difference between total purchase cost and base material costs
  const transportationCost = calculateTransportationCost()

  // Calculate holding cost using the same method as the game engine
  const currentValuation = calculateDailyInventoryValuation(gameState, gameState.day)
  const holdingCosts = calculateInventoryHoldingCosts(currentValuation)
  const holdingCost = holdingCosts.totalHoldingCost

  // Calculate revenue from both direct sales and customer orders
  const revenue = calculateRevenue()

  // Calculate total cost as sum of all components
  const totalCost = purchaseCost + productionCost + holdingCost
  const profit = revenue - totalCost

  // Check if the player is only attempting sales (no purchases or production)
  const isOnlySales = () => {
    const noOrders = supplierOrders.every(
      (order) =>
        order.pattyPurchase === 0 &&
        order.cheesePurchase === 0 &&
        order.bunPurchase === 0 &&
        order.potatoPurchase === 0,
    )

    const hasCustomerOrders = action.customerOrders && action.customerOrders.some((order) => order.quantity > 0)
    return noOrders && action.production === 0 && (action.salesAttempt > 0 || hasCustomerOrders)
  }

  // Calculate revenue from both direct sales and customer orders
  function calculateRevenue(): number {
    // Revenue from direct sales
    const directSalesRevenue = action.salesAttempt * gameState.dailyDemand.pricePerUnit

    // Revenue from customer orders
    let customerOrdersRevenue = 0
    if (action.customerOrders) {
      for (const order of action.customerOrders) {
        const customer = levelConfig.customers?.find((c) => c.id === order.customerId)
        if (customer && order.quantity > 0) {
          // Base revenue
          customerOrdersRevenue += order.quantity * customer.pricePerUnit

          // Subtract transport costs if applicable
          if (customer.transportCosts && customer.transportCosts[order.quantity]) {
            customerOrdersRevenue -= customer.transportCosts[order.quantity]
          }
        }
      }
    }

    return directSalesRevenue + customerOrdersRevenue
  }

  // Calculate transportation cost as the difference between total purchase cost and base material costs
  function calculateTransportationCost(): number {
    let baseMaterialCost = 0
    let totalPurchaseCost = 0

    // Calculate base material costs
    for (const order of supplierOrders) {
      const supplier = levelConfig.suppliers.find((s) => s.id === order.supplierId)
      if (!supplier) continue

      if (order.pattyPurchase > 0) {
        const basePrice = levelConfig.materialBasePrices.patty || 0
        baseMaterialCost += order.pattyPurchase * basePrice
      }

      if (order.cheesePurchase > 0) {
        const basePrice = levelConfig.materialBasePrices.cheese || 0
        baseMaterialCost += order.cheesePurchase * basePrice
      }

      if (order.bunPurchase > 0) {
        const basePrice = levelConfig.materialBasePrices.bun || 0
        baseMaterialCost += order.bunPurchase * basePrice
      }

      if (order.potatoPurchase > 0) {
        const basePrice = levelConfig.materialBasePrices.potato || 0
        baseMaterialCost += order.potatoPurchase * basePrice
      }
    }

    totalPurchaseCost = calculateTotalPurchaseCost()
    return Math.max(0, totalPurchaseCost - baseMaterialCost)
  }

  // Determine if the Next Day button should be disabled
  const isButtonDisabled = () => {
    if (isLoading || gameEnded || gameState.gameOver) return true

    // Special case: if player has 0 cash but is only trying to sell, allow it
    if (gameState.cash <= 0 && isOnlySales()) return false

    // Otherwise, check if they can afford all actions
    return totalCost > gameState.cash
  }

  // Determine why the Next Day button is disabled
  const getDisabledReason = () => {
    if (isLoading) return "Processing your actions..."
    if (gameEnded || gameState.gameOver) return "Game is over"

    return getNextDayDisabledReason()
  }

  // Calculate annual holding cost rate (25%)
  const annualRate = 0.25 * 100

  return (
    <div className="bg-gray-50 p-4 rounded-lg border cost-summary">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Purchase Cost</p>
          <p className="text-xl font-bold">{purchaseCost.toFixed(2)} kr</p>
          <p className="text-xs text-muted-foreground mt-1">Sum of all material purchases</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Transportation Cost</p>
          <p className="text-xl font-bold">{transportationCost.toFixed(2)} kr</p>
          <p className="text-xs text-muted-foreground mt-1">Delivery and shipping costs</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Production Cost</p>
          <p className="text-xl font-bold">{productionCost.toFixed(2)} kr</p>
          <p className="text-xs text-muted-foreground mt-1">
            Production quantity × {levelConfig.productionCostPerUnit} kr per unit
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Daily Holding Cost <span className="text-xs">({annualRate}% annual rate)</span>
          </p>
          <p className="text-xl font-bold">{holdingCost.toFixed(2)} kr</p>
          <p className="text-xs text-muted-foreground mt-1">Total inventory value × 25% annual rate ÷ 365 days</p>
        </div>
      </div>
      <div className="mt-4 border-t pt-4 flex justify-between items-center">
        <div className="grid grid-cols-3 gap-8 flex-1">
          <div>
            <p className="text-sm font-medium">Total Cost</p>
            <p className="text-xl font-bold">{totalCost.toFixed(2)} kr</p>
          </div>
          <div>
            <p className="text-sm font-medium">Revenue</p>
            <p className="text-xl font-bold text-green-600">{revenue.toFixed(2)} kr</p>
          </div>
          <div>
            <p className="text-sm font-medium">Profit</p>
            <p className={`text-xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {profit.toFixed(2)} kr
            </p>
          </div>
        </div>
        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    className="next-day-button"
                    onClick={onProcessDay}
                    disabled={isNextDayButtonDisabled() || isButtonDisabled()}
                  >
                    {isLoading ? "Processing..." : "Next Day"} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </span>
              </TooltipTrigger>
              {(isNextDayButtonDisabled() || isButtonDisabled()) && (
                <TooltipContent>
                  <p>{getDisabledReason()}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
