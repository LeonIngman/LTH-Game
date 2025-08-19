"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { CheckCircle, Calendar, AlertTriangle } from "lucide-react"
import { PATTIES_PER_MEAL, CHEESE_PER_MEAL, BUNS_PER_MEAL, POTATOES_PER_MEAL } from "@/lib/game/inventory-management"
import type { ProductionPopupProps } from "@/types/components"
import { cn } from "@/lib/utils"


export function ProductionPopup({
  isOpen,
  onClose,
  production,
  maxProduction: propMaxProduction,
  onProductionChange,
  isDisabled,
  plannedProduction,
  forecastData,
  currentDay = 1,
  inventory,
  requiresForecasting,
}: Readonly<ProductionPopupProps>) {
  // Local state for pending production
  const [pendingProduction, setPendingProduction] = useState(10) // Default to 10 instead of 0
  const [hasConfirmedProduction, setHasConfirmedProduction] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Initialize pending production when popup opens
  useEffect(() => {
    setPendingProduction(production > 0 ? production : 10) // Default to 10 if no production set
    setHasConfirmedProduction(production > 0)
    setShowSuccessMessage(false)
  }, [production, isOpen])

  // Calculate max production for each ingredient
  const maxProductionByPatty = Math.floor(inventory.patty / PATTIES_PER_MEAL)
  const maxProductionByCheese = Math.floor(inventory.cheese / CHEESE_PER_MEAL)
  const maxProductionByBun = Math.floor(inventory.bun / BUNS_PER_MEAL)
  const maxProductionByPotato = Math.floor(inventory.potato / POTATOES_PER_MEAL)

  // Calculate the actual maximum production
  const calculatedMaxProduction = Math.min(
    maxProductionByPatty,
    maxProductionByCheese,
    maxProductionByBun,
    maxProductionByPotato,
    30, // Production capacity
  )

  // Find the limiting ingredient
  const limitingFactor = [
    { name: "Patties", max: maxProductionByPatty },
    { name: "Cheese", max: maxProductionByCheese },
    { name: "Buns", max: maxProductionByBun },
    { name: "Potatoes", max: maxProductionByPotato },
  ].reduce((prev, current) => (current.max < prev.max ? current : prev), { name: "Patties", max: maxProductionByPatty })

  // Define production options (excluding 0)
  const allProductionOptions = [10, 20, 30]

  // Check if there are pending changes
  const hasPendingChanges = pendingProduction !== production

  // Confirm the production
  const handleConfirmProduction = () => {
    onProductionChange(pendingProduction.toString())
    setHasConfirmedProduction(pendingProduction > 0)
    setShowSuccessMessage(true)

    // Auto-close after showing success message
    setTimeout(() => {
      setShowSuccessMessage(false)
      onClose()
    }, 1500) // Show success message for 1.5 seconds before closing
  }

  // Calculate total production cost
  const productionCost = pendingProduction * 4

  // Helper function to check if an option is available
  const isOptionAvailable = (option: number) => option <= calculatedMaxProduction

  // Extract daily production rates from forecast data
  const getDailyProductionRates = () => {
    if (!forecastData) return null

    // If we have explicit production rates
    if (forecastData.productionRates) {
      return forecastData.productionRates
    }

    // If we have customer forecasts, calculate implied production rates
    if (
      forecastData["yummy-zone"] !== undefined ||
      forecastData["toast-to-go"] !== undefined ||
      forecastData["study-fuel"] !== undefined
    ) {
      // For simplicity, we'll assume equal distribution across days
      // In a real implementation, you might have more complex logic
      const totalForecast =
        (forecastData["yummy-zone"] || 0) + (forecastData["toast-to-go"] || 0) + (forecastData["study-fuel"] || 0)

      // Assume 5 days for simplicity, adjust as needed
      const daysToComplete = 5
      const dailyRate = Math.ceil(totalForecast / daysToComplete)

      // Create a daily distribution
      const dailyRates: Record<string, number> = {}
      for (let i = 1; i <= daysToComplete; i++) {
        dailyRates[`day${i}`] = dailyRate
      }

      return dailyRates
    }

    return null
  }

  const dailyProductionRates = getDailyProductionRates()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col space-y-2">
            <DialogTitle>Production - Main Factory</DialogTitle>
            {hasConfirmedProduction && !hasPendingChanges && production > 0 && (
              <Badge variant="default" className="bg-green-500 flex items-center gap-1 w-fit">
                <CheckCircle className="h-3 w-3" />
                Confirmed
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Available Ingredients</CardTitle>
              <CardDescription>Current inventory levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      maxProductionByPatty === limitingFactor.max && maxProductionByPatty < 30 ? "text-amber-600" : "",
                    )}
                  >
                    Patties: {inventory.patty} ({maxProductionByPatty} meals)
                  </p>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      maxProductionByCheese === limitingFactor.max && maxProductionByCheese < 30
                        ? "text-amber-600"
                        : "",
                    )}
                  >
                    Cheese: {inventory.cheese} ({maxProductionByCheese} meals)
                  </p>
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      maxProductionByBun === limitingFactor.max && maxProductionByBun < 30 ? "text-amber-600" : "",
                    )}
                  >
                    Buns: {inventory.bun} ({maxProductionByBun} meals)
                  </p>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      maxProductionByPotato === limitingFactor.max && maxProductionByPotato < 30
                        ? "text-amber-600"
                        : "",
                    )}
                  >
                    Potatoes: {inventory.potato} ({maxProductionByPotato} meals)
                  </p>
                </div>
              </div>
              {calculatedMaxProduction < 30 && (
                <p className="text-amber-600 text-sm mt-3">
                  Limited by {limitingFactor.name}: Can produce max {limitingFactor.max} meals
                </p>
              )}
            </CardContent>
          </Card>

          {/* Forecasting Plan Section */}
          {requiresForecasting && dailyProductionRates && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Forecasting Production Plan
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Production is automatically set based on your forecasting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(dailyProductionRates).map(([day, rate], index) => {
                      if (Number(day) !== 0) { // skip day 0

                        const dayNumber = day.replace("day", "")
                        const isCurrentDay = Number.parseInt(dayNumber) === currentDay
                        const isPastDay = Number.parseInt(dayNumber) < currentDay

                        let containerClass = "border-blue-200"
                        if (isCurrentDay) {
                          containerClass = "border-blue-400 bg-blue-100"
                        } else if (isPastDay) {
                          containerClass = "border-gray-200 bg-gray-50 opacity-70"
                        }

                        return (
                          <div
                            key={day}
                            className={cn(
                              "p-2 rounded-md border flex justify-between items-center",
                              containerClass,
                            )}
                          >
                            <span className={cn("text-sm font-medium", isCurrentDay ? "text-blue-800" : "text-blue-700")}>
                              Day {dayNumber}:
                            </span>
                            <span className={cn("font-bold", isCurrentDay ? "text-blue-800" : "text-blue-700")}>
                              {String(rate)} meals
                              {isCurrentDay && (
                                <Badge variant="outline" className="ml-1 bg-blue-200 border-blue-300 text-blue-800">
                                  Today
                                </Badge>
                              )}
                            </span>
                          </div>
                        )
                      }
                    })}
                  </div>

                  {calculatedMaxProduction < (dailyProductionRates[`day${currentDay}`] || 0) && (
                    <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md mt-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-amber-800">
                        <p className="font-medium">Insufficient ingredients for today's planned production.</p>
                        <p>
                          The factory will produce {calculatedMaxProduction} meals instead of the planned{" "}
                          {dailyProductionRates[`day${currentDay}`]} meals.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-blue-700 mt-2">
                    <p>
                      💡 Production is automatically set according to your forecasting plan. The factory will produce as
                      many meals as possible based on available ingredients.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!requiresForecasting && (
            <div className="space-y-2">
              <Label>Production Quantity</Label>
              <div className="flex flex-wrap gap-2">
                {allProductionOptions.map((option) => (
                  <Button
                    key={option}
                    variant={pendingProduction === option ? "default" : "outline"}
                    onClick={() => {
                      setPendingProduction(option)
                      setHasConfirmedProduction(false)
                    }}
                    disabled={isDisabled || !isOptionAvailable(option)}
                    className={cn("flex-1", !isOptionAvailable(option) && "opacity-50 cursor-not-allowed")}
                    title={!isOptionAvailable(option) ? `Insufficient ingredients for ${option} meals` : undefined}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Maximum production: {calculatedMaxProduction} meals
              {calculatedMaxProduction === 0 && <span className="text-destructive"> (Insufficient ingredients)</span>}
            </p>

            {/* Production cost information */}
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="font-medium">Production Cost: 4 kr per meal</p>
              {pendingProduction > 0 && (
                <p className="text-sm mt-1">
                  Total cost for {pendingProduction} meals: {productionCost} kr
                </p>
              )}
            </div>

            <div className="text-sm mt-2">
              <p>Each meal requires:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>{PATTIES_PER_MEAL} Patty</li>
                <li>{CHEESE_PER_MEAL} Cheese</li>
                <li>{BUNS_PER_MEAL} Buns</li>
                <li>{POTATOES_PER_MEAL} Potatoes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="py-4 px-6 bg-green-50 border border-green-200 rounded-md mx-6">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Production order placed successfully!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              {pendingProduction} meals will be produced at 4 kr per meal.
            </p>
          </div>
        )}

        <DialogFooter className="flex gap-2">{/* Only show footer if not showing success message */}
          {!showSuccessMessage && (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {!requiresForecasting && pendingProduction >= 0 && (
                <Button
                  onClick={handleConfirmProduction}
                  disabled={isDisabled || (!hasPendingChanges && hasConfirmedProduction)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {hasPendingChanges ? "Confirm Production" : "Production Confirmed"}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
