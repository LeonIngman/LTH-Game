"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PATTIES_PER_MEAL, CHEESE_PER_MEAL, BUNS_PER_MEAL, POTATOES_PER_MEAL } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface ProductionTabProps {
  production: number
  maxProduction: number
  onProductionChange: (value: string) => void
  isDisabled: boolean
  inventory?: {
    patty: number
    cheese: number
    bun: number
    potato: number
  }
}

export function ProductionTab({
  production,
  maxProduction,
  onProductionChange,
  isDisabled,
  inventory,
}: ProductionTabProps) {
  // Define the allowed production values
  const productionOptions = [0, 10, 20, 30]

  // Calculate max production for each ingredient
  const maxProductionByPatty = inventory ? Math.floor(inventory.patty / PATTIES_PER_MEAL) : 0
  const maxProductionByCheese = inventory ? Math.floor(inventory.cheese / CHEESE_PER_MEAL) : 0
  const maxProductionByBun = inventory ? Math.floor(inventory.bun / BUNS_PER_MEAL) : 0
  const maxProductionByPotato = inventory ? Math.floor(inventory.potato / POTATOES_PER_MEAL) : 0

  // Find the limiting ingredient
  const limitingFactor = [
    { name: "Patties", max: maxProductionByPatty },
    { name: "Cheese", max: maxProductionByCheese },
    { name: "Buns", max: maxProductionByBun },
    { name: "Potatoes", max: maxProductionByPotato },
  ].reduce((prev, current) => (current.max < prev.max ? current : prev))

  return (
    <div className="space-y-4">
      {inventory && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Available Materials</h3>
            <ul className="text-sm">
              <li
                className={
                  maxProductionByPatty === limitingFactor.max && maxProductionByPatty < 30 ? "text-amber-600" : ""
                }
              >
                Patties: {inventory.patty} ({maxProductionByPatty} meals)
              </li>
              <li
                className={
                  maxProductionByCheese === limitingFactor.max && maxProductionByCheese < 30 ? "text-amber-600" : ""
                }
              >
                Cheese: {inventory.cheese} ({maxProductionByCheese} meals)
              </li>
              <li
                className={maxProductionByBun === limitingFactor.max && maxProductionByBun < 30 ? "text-amber-600" : ""}
              >
                Buns: {inventory.bun} ({maxProductionByBun} meals)
              </li>
              <li
                className={
                  maxProductionByPotato === limitingFactor.max && maxProductionByPotato < 30 ? "text-amber-600" : ""
                }
              >
                Potatoes: {inventory.potato} ({maxProductionByPotato} meals)
              </li>
            </ul>
            {maxProduction < 30 && (
              <p className="text-amber-600 text-xs mt-1">
                Limited by {limitingFactor.name}: Can produce max {limitingFactor.max} meals
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Meals to Produce (Max: {maxProduction})</Label>
        <div className="flex flex-wrap gap-2">
          {productionOptions.map((option) => (
            <Button
              key={option}
              variant={production === option ? "default" : "outline"}
              onClick={() => onProductionChange(option.toString())}
              disabled={isDisabled || option > maxProduction}
              className={cn("flex-1 min-w-[60px]", option > maxProduction && "opacity-50 cursor-not-allowed")}
              title={option > maxProduction ? `Insufficient ingredients for ${option} meals` : undefined}
            >
              {option}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Each meal requires {PATTIES_PER_MEAL} patty, {CHEESE_PER_MEAL} cheese, {BUNS_PER_MEAL} buns, and{" "}
          {POTATOES_PER_MEAL} potatoes.
        </p>
      </div>
    </div>
  )
}
