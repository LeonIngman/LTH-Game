import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { GameState, LevelConfig } from "@/types/game"
import { calculateHoldingCost, getHoldingCostBreakdown } from "@/lib/game/calculations"
import { HOLDING_COSTS } from "@/lib/game/constants"

interface InventorySectionProps {
  gameState: GameState
  levelConfig: LevelConfig
}

export function InventorySection({ gameState, levelConfig }: InventorySectionProps) {
  // Get holding cost breakdown for display - pass levelConfig as the second parameter
  const holdingCostBreakdown = getHoldingCostBreakdown(gameState.inventory, levelConfig)
  const totalHoldingCost = calculateHoldingCost(gameState.inventory, levelConfig)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory</CardTitle>
        <CardDescription>Current stock levels</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm">Patties</p>
            <p className="font-semibold">{gameState.inventory.patty} units</p>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-red-500"
              style={{ width: `${Math.min((gameState.inventory.patty / 600) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm">Cheese</p>
            <p className="font-semibold">{gameState.inventory.cheese} units</p>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-yellow-500"
              style={{ width: `${Math.min((gameState.inventory.cheese / 600) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm">Buns</p>
            <p className="font-semibold">{gameState.inventory.bun} units</p>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${Math.min((gameState.inventory.bun / 600) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm">Potatoes</p>
            <p className="font-semibold">{gameState.inventory.potato} units</p>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-orange-500"
              style={{ width: `${Math.min((gameState.inventory.potato / 600) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm">Burger Meals</p>
            <p className="font-semibold">{gameState.inventory.finishedGoods} units</p>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${Math.min((gameState.inventory.finishedGoods / 600) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Holding Costs */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Holding Costs</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Patty:</span>
              <span>{HOLDING_COSTS.PATTY.toFixed(2)} kr/unit</span>
            </div>
            <div className="flex justify-between">
              <span>Buns:</span>
              <span>{HOLDING_COSTS.BUN.toFixed(2)} kr/unit</span>
            </div>
            <div className="flex justify-between">
              <span>Cheese:</span>
              <span>{HOLDING_COSTS.CHEESE.toFixed(2)} kr/unit</span>
            </div>
            <div className="flex justify-between">
              <span>Potato:</span>
              <span>{HOLDING_COSTS.POTATO.toFixed(2)} kr/unit</span>
            </div>
            <div className="flex justify-between mt-2 pt-2 border-t">
              <span>Production Cost:</span>
              <span>{levelConfig.productionCostPerUnit.toFixed(2)} kr/meal</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
