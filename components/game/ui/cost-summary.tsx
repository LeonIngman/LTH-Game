"use client"

import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { CostSummaryProps } from "@/types/components"

export function CostSummary({
  gameState,
  levelConfig,
  action,
  supplierOrders,
  isLoading,
  gameEnded,
  onProcessDay,
  calculateProductionCost,
  calculateMaterialPurchaseCost,
  calculateMaterialTransportationCost,
  calculateRestaurantTransportationCost,
  calculateHoldingCost,
  calculateOverstockCost,
  calculateRevenue,
  isNextDayButtonDisabled,
  getNextDayDisabledReason,
  checkSufficientFunds,
  calculateTotalCost,
  calculateProfit,
}: Readonly<CostSummaryProps>) {
  const materialPurchaseCost = calculateMaterialPurchaseCost()
  const materialTransportationCost = calculateMaterialTransportationCost()
  const productionCost = calculateProductionCost()
  const restaurantTransportationCost = calculateRestaurantTransportationCost()
  const holdingCost = calculateHoldingCost()
  const overstockCost = calculateOverstockCost()
  const revenue = calculateRevenue()
  const totalCost = calculateTotalCost()
  const profit = calculateProfit()

  // Check if the player is only attempting sales (no purchases or production)
  const isOnlySales = () => {
    const noOrders = supplierOrders.every(
      (order) =>
        order.pattyPurchase === 0 &&
        order.cheesePurchase === 0 &&
        order.bunPurchase === 0 &&
        order.potatoPurchase === 0,
    )

    const hasCustomerOrders = action.customerOrders?.some((order) => order.quantity > 0)
    return noOrders && action.production === 0 && (hasCustomerOrders)
  }

  // Check funds before allowing action
  const fundsCheck = checkSufficientFunds()

  // Determine if the Next Day button should be disabled
  const isButtonDisabled = () => {
    if (isLoading || gameEnded || gameState.gameOver) return true

    // Special case: if player has 0 cash but is only trying to sell, allow it
    if (gameState.cash <= 0 && isOnlySales()) return false

    // Use the pre-check for insufficient funds
    return !fundsCheck.sufficient
  }

  // Determine why the Next Day button is disabled
  const getDisabledReason = () => {
    if (isLoading) return "Processing your actions..."
    if (gameEnded || gameState.gameOver) return "Game is over"

    // If insufficient funds, show the specific message from pre-check
    if (!fundsCheck.sufficient && fundsCheck.message) {
      return fundsCheck.message
    }

    return getNextDayDisabledReason()
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg border cost-summary" data-tutorial="cost-summary" data-testid="cost-summary">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Purchase Cost</p>
          <p className="text-xl font-bold">{materialPurchaseCost.toFixed(2)} kr</p>
          <p className="text-xs text-muted-foreground mt-1">Base material costs</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Supplier Transport</p>
          <p className="text-xl font-bold">{materialTransportationCost.toFixed(2)} kr</p>
          <p className="text-xs text-muted-foreground mt-1">Supplier delivery costs</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Production Cost</p>
          <p className="text-xl font-bold">{productionCost.toFixed(2)} kr</p>
          <p className="text-xs text-muted-foreground mt-1">
            Production quantity × {levelConfig.productionCostPerUnit} kr per unit
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Holding Cost</p>
          <p className="text-xl font-bold">{holdingCost.toFixed(2)} kr</p>
          <p className="text-xs text-muted-foreground mt-1">Inventory value × 25% annual rate ÷ 365 days</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Overstock Cost</p>
          <p className="text-xl font-bold">{overstockCost.toFixed(2)} kr</p>
          <p className="text-xs text-muted-foreground mt-1">Overstocked inventory × 25% annual rate ÷ 365 days</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Restaurant Transport</p>
          <p className="text-xl font-bold">{restaurantTransportationCost.toFixed(2)} kr</p>
          <p className="text-xs text-muted-foreground mt-1">Customer delivery costs</p>
        </div>
      </div>
      <div className="mt-4 border-t pt-4 flex justify-between items-center">
        <div className="grid grid-cols-3 gap-4 flex-1">
          <div className="text-center">
            <p className="text-sm font-medium">Total Cost</p>
            <p className="text-xl font-bold text-red-600">{totalCost.toFixed(2)} kr</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Revenue</p>
            <p className="text-xl font-bold text-green-600">{revenue.toFixed(2)} kr</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Profit</p>
            <p className={`text-xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {profit.toFixed(2)} kr
            </p>
          </div>
        </div>

        {/* Insufficient Funds Warning */}
        {!fundsCheck.sufficient && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-center">
            <p className="text-sm font-medium text-red-800">⚠️ Insufficient Funds</p>
            <p className="text-xs text-red-600 mt-1">
              Available: {gameState.cash.toFixed(2)} kr | Needed: {totalCost.toFixed(2)} kr
            </p>
          </div>
        )}

        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    className="next-day-button"
                    onClick={onProcessDay}
                    disabled={isButtonDisabled()}
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
