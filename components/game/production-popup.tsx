"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { CheckCircle } from "lucide-react"
import { PATTIES_PER_MEAL, CHEESE_PER_MEAL, BUNS_PER_MEAL, POTATOES_PER_MEAL } from "@/lib/constants"
import type { Inventory } from "@/types/game"
import { cn } from "@/lib/utils"

interface ProductionPopupProps {
  isOpen: boolean
  onClose: () => void
  production: number
  maxProduction: number
  onProductionChange: (value: string) => void
  isDisabled: boolean
  inventory: Inventory
}

export function ProductionPopup({
  isOpen,
  onClose,
  production,
  maxProduction: propMaxProduction,
  onProductionChange,
  isDisabled,
  inventory,
}: ProductionPopupProps) {
  // Local state for pending production
  const [pendingProduction, setPendingProduction] = useState(0)
  const [hasConfirmedProduction, setHasConfirmedProduction] = useState(false)

  // Initialize pending production when popup opens
  useEffect(() => {
    setPendingProduction(production)
    setHasConfirmedProduction(production > 0)
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
  ].reduce((prev, current) => (current.max < prev.max ? current : prev))

  // Define all production options
  const allProductionOptions = [0, 10, 20, 30]

  // Check if there are pending changes
  const hasPendingChanges = pendingProduction !== production

  // Confirm the production
  const handleConfirmProduction = () => {
    onProductionChange(pendingProduction.toString())
    setHasConfirmedProduction(pendingProduction > 0)
  }

  // Calculate total production cost
  const productionCost = pendingProduction * 4

  // Helper function to check if an option is available
  const isOptionAvailable = (option: number) => option <= calculatedMaxProduction

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Production - Main Factory</span>
            {hasConfirmedProduction && !hasPendingChanges && production > 0 && (
              <Badge variant="default" className="bg-green-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Confirmed
              </Badge>
            )}
          </DialogTitle>
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
                    Patties: {inventory.patty} ({Math.min(maxProductionByPatty, 30)} meals)
                  </p>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      maxProductionByCheese === limitingFactor.max && maxProductionByCheese < 30
                        ? "text-amber-600"
                        : "",
                    )}
                  >
                    Cheese: {inventory.cheese} ({Math.min(maxProductionByCheese, 30)} meals)
                  </p>
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      maxProductionByBun === limitingFactor.max && maxProductionByBun < 30 ? "text-amber-600" : "",
                    )}
                  >
                    Buns: {inventory.bun} ({Math.min(maxProductionByBun, 30)} meals)
                  </p>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      maxProductionByPotato === limitingFactor.max && maxProductionByPotato < 30
                        ? "text-amber-600"
                        : "",
                    )}
                  >
                    Potatoes: {inventory.potato} ({Math.min(maxProductionByPotato, 30)} meals)
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

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {pendingProduction >= 0 && (
            <Button
              onClick={handleConfirmProduction}
              disabled={isDisabled || (!hasPendingChanges && hasConfirmedProduction)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {hasPendingChanges ? "Confirm Production" : "Production Confirmed"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
