"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Check, X, PlusCircle, MinusCircle } from "lucide-react"
import type { GameAction, LevelConfig, GameState } from "@/types/game"

interface PlanningWidgetProps {
  gameState: GameState
  levelConfig: LevelConfig
  plannedAction: GameAction
  setPlannedAction: (action: GameAction) => void
  calculateTotalPurchaseCost: () => number
  calculateProductionCost: () => number
  calculateHoldingCost: () => number
  calculateTransportationCost: () => number
  calculateRevenue: () => number
  onApplyPlan: () => void
  onCancelPlan: () => void
}

export function PlanningWidget({
  gameState,
  levelConfig,
  plannedAction,
  setPlannedAction,
  calculateTotalPurchaseCost,
  calculateProductionCost,
  calculateHoldingCost,
  calculateTransportationCost,
  calculateRevenue,
  onApplyPlan,
  onCancelPlan,
}: PlanningWidgetProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [projectedInventory, setProjectedInventory] = useState({ ...gameState.inventory })
  const [projectedCash, setProjectedCash] = useState(gameState.cash)

  // Calculate projected inventory and cash based on planned actions
  useEffect(() => {
    // Start with current inventory
    const newInventory = { ...gameState.inventory }

    // Add planned supplier orders
    for (const order of plannedAction.supplierOrders || []) {
      newInventory.patty += order.pattyPurchase || 0
      newInventory.bun += order.bunPurchase || 0
      newInventory.cheese += order.cheesePurchase || 0
      newInventory.potato += order.potatoPurchase || 0
    }

    // Subtract production materials
    if (plannedAction.production > 0) {
      newInventory.patty -= plannedAction.production
      newInventory.bun -= plannedAction.production
      newInventory.cheese -= plannedAction.production
      newInventory.potato -= plannedAction.production * 4
      newInventory.finishedGoods = (newInventory.finishedGoods || 0) + plannedAction.production
    }

    // Subtract sales
    const totalSales =
      plannedAction.salesAttempt + (plannedAction.customerOrders || []).reduce((sum, order) => sum + order.quantity, 0)

    newInventory.finishedGoods = Math.max(0, (newInventory.finishedGoods || 0) - totalSales)

    setProjectedInventory(newInventory)

    // Calculate projected cash
    const totalCost =
      calculateTotalPurchaseCost() + calculateProductionCost() + calculateHoldingCost() + calculateTransportationCost()

    const revenue = calculateRevenue()
    const projectedCashValue = gameState.cash - totalCost + revenue

    setProjectedCash(projectedCashValue)
  }, [
    plannedAction,
    gameState.inventory,
    gameState.cash,
    calculateTotalPurchaseCost,
    calculateProductionCost,
    calculateHoldingCost,
    calculateTransportationCost,
    calculateRevenue,
  ])

  // Handle supplier order changes
  const handleSupplierOrderChange = (supplierId: number, material: string, value: number) => {
    const updatedOrders = [...(plannedAction.supplierOrders || [])]
    const orderIndex = updatedOrders.findIndex((order) => order.supplierId === supplierId)

    if (orderIndex === -1) {
      // Create new order if it doesn't exist
      const newOrder = {
        supplierId,
        pattyPurchase: 0,
        bunPurchase: 0,
        cheesePurchase: 0,
        potatoPurchase: 0,
      }

      newOrder[`${material}Purchase`] = value
      updatedOrders.push(newOrder)
    } else {
      // Update existing order
      updatedOrders[orderIndex] = {
        ...updatedOrders[orderIndex],
        [`${material}Purchase`]: value,
      }
    }

    setPlannedAction({
      ...plannedAction,
      supplierOrders: updatedOrders,
    })
  }

  // Handle production change
  const handleProductionChange = (value: number) => {
    setPlannedAction({
      ...plannedAction,
      production: Math.max(0, value),
    })
  }

  // Handle sales change
  const handleSalesChange = (value: number) => {
    setPlannedAction({
      ...plannedAction,
      salesAttempt: Math.max(0, value),
    })
  }

  // Calculate financial projections
  const purchaseCost = calculateTotalPurchaseCost()
  const productionCost = calculateProductionCost()
  const holdingCost = calculateHoldingCost()
  const transportCost = calculateTransportationCost()
  const revenue = calculateRevenue()
  const totalCost = purchaseCost + productionCost + holdingCost + transportCost
  const profit = revenue - totalCost

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Planning Mode</CardTitle>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={onCancelPlan}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button size="sm" variant="default" onClick={onApplyPlan}>
              <Check className="h-4 w-4 mr-1" />
              Apply
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Financial Projections</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Purchase Cost:</div>
                <div className="text-right">{purchaseCost.toFixed(2)} kr</div>

                <div>Transport Cost:</div>
                <div className="text-right">{transportCost.toFixed(2)} kr</div>

                <div>Production Cost:</div>
                <div className="text-right">{productionCost.toFixed(2)} kr</div>

                <div>Holding Cost:</div>
                <div className="text-right">{holdingCost.toFixed(2)} kr</div>

                <div className="font-medium">Total Cost:</div>
                <div className="text-right font-medium">{totalCost.toFixed(2)} kr</div>

                <div className="font-medium">Revenue:</div>
                <div className="text-right font-medium">{revenue.toFixed(2)} kr</div>

                <div className="font-medium pt-1 border-t">Profit:</div>
                <div
                  className={`text-right font-medium pt-1 border-t ${profit >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {profit.toFixed(2)} kr
                </div>

                <div className="font-medium pt-1">Projected Cash:</div>
                <div
                  className={`text-right font-medium pt-1 ${projectedCash >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {projectedCash.toFixed(2)} kr
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleProductionChange(plannedAction.production + 10)}
                >
                  +10 Production
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleSalesChange(plannedAction.salesAttempt + 10)}>
                  +10 Sales
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Current Inventory</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Patty:</div>
                <div className="text-right">{gameState.inventory.patty}</div>

                <div>Bun:</div>
                <div className="text-right">{gameState.inventory.bun}</div>

                <div>Cheese:</div>
                <div className="text-right">{gameState.inventory.cheese}</div>

                <div>Potato:</div>
                <div className="text-right">{gameState.inventory.potato}</div>

                <div>Finished Goods:</div>
                <div className="text-right">{gameState.inventory.finishedGoods || 0}</div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Projected Inventory</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Patty:</div>
                <div className="text-right flex justify-end items-center">
                  {gameState.inventory.patty}
                  <ArrowRight className="h-3 w-3 mx-1" />
                  <span
                    className={
                      projectedInventory.patty > gameState.inventory.patty
                        ? "text-green-600"
                        : projectedInventory.patty < gameState.inventory.patty
                          ? "text-red-600"
                          : ""
                    }
                  >
                    {projectedInventory.patty}
                  </span>
                </div>

                <div>Bun:</div>
                <div className="text-right flex justify-end items-center">
                  {gameState.inventory.bun}
                  <ArrowRight className="h-3 w-3 mx-1" />
                  <span
                    className={
                      projectedInventory.bun > gameState.inventory.bun
                        ? "text-green-600"
                        : projectedInventory.bun < gameState.inventory.bun
                          ? "text-red-600"
                          : ""
                    }
                  >
                    {projectedInventory.bun}
                  </span>
                </div>

                <div>Cheese:</div>
                <div className="text-right flex justify-end items-center">
                  {gameState.inventory.cheese}
                  <ArrowRight className="h-3 w-3 mx-1" />
                  <span
                    className={
                      projectedInventory.cheese > gameState.inventory.cheese
                        ? "text-green-600"
                        : projectedInventory.cheese < gameState.inventory.cheese
                          ? "text-red-600"
                          : ""
                    }
                  >
                    {projectedInventory.cheese}
                  </span>
                </div>

                <div>Potato:</div>
                <div className="text-right flex justify-end items-center">
                  {gameState.inventory.potato}
                  <ArrowRight className="h-3 w-3 mx-1" />
                  <span
                    className={
                      projectedInventory.potato > gameState.inventory.potato
                        ? "text-green-600"
                        : projectedInventory.potato < gameState.inventory.potato
                          ? "text-red-600"
                          : ""
                    }
                  >
                    {projectedInventory.potato}
                  </span>
                </div>

                <div>Finished Goods:</div>
                <div className="text-right flex justify-end items-center">
                  {gameState.inventory.finishedGoods || 0}
                  <ArrowRight className="h-3 w-3 mx-1" />
                  <span
                    className={
                      (projectedInventory.finishedGoods || 0) > (gameState.inventory.finishedGoods || 0)
                        ? "text-green-600"
                        : (projectedInventory.finishedGoods || 0) < (gameState.inventory.finishedGoods || 0)
                          ? "text-red-600"
                          : ""
                    }
                  >
                    {projectedInventory.finishedGoods || 0}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Production</h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleProductionChange(plannedAction.production - 1)}
                  disabled={plannedAction.production <= 0}
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center">{plannedAction.production} units</div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleProductionChange(plannedAction.production + 1)}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Sales</h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSalesChange(plannedAction.salesAttempt - 1)}
                  disabled={plannedAction.salesAttempt <= 0}
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center">{plannedAction.salesAttempt} units</div>
                <Button size="sm" variant="outline" onClick={() => handleSalesChange(plannedAction.salesAttempt + 1)}>
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Supplier Orders</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {levelConfig.suppliers.map((supplier) => (
                  <div key={supplier.id} className="border rounded-md p-2">
                    <div className="font-medium text-xs mb-1">{supplier.name}</div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {supplier.material === "patty" && (
                        <div className="col-span-2 flex items-center justify-between">
                          <span>Patty:</span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                const currentValue =
                                  plannedAction.supplierOrders?.find((o) => o.supplierId === supplier.id)
                                    ?.pattyPurchase || 0
                                handleSupplierOrderChange(supplier.id, "patty", Math.max(0, currentValue - 10))
                              }}
                            >
                              <MinusCircle className="h-3 w-3" />
                            </Button>
                            <span>
                              {plannedAction.supplierOrders?.find((o) => o.supplierId === supplier.id)?.pattyPurchase ||
                                0}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                const currentValue =
                                  plannedAction.supplierOrders?.find((o) => o.supplierId === supplier.id)
                                    ?.pattyPurchase || 0
                                handleSupplierOrderChange(supplier.id, "patty", currentValue + 10)
                              }}
                            >
                              <PlusCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {supplier.material === "bun" && (
                        <div className="col-span-2 flex items-center justify-between">
                          <span>Bun:</span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                const currentValue =
                                  plannedAction.supplierOrders?.find((o) => o.supplierId === supplier.id)
                                    ?.bunPurchase || 0
                                handleSupplierOrderChange(supplier.id, "bun", Math.max(0, currentValue - 10))
                              }}
                            >
                              <MinusCircle className="h-3 w-3" />
                            </Button>
                            <span>
                              {plannedAction.supplierOrders?.find((o) => o.supplierId === supplier.id)?.bunPurchase ||
                                0}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                const currentValue =
                                  plannedAction.supplierOrders?.find((o) => o.supplierId === supplier.id)
                                    ?.bunPurchase || 0
                                handleSupplierOrderChange(supplier.id, "bun", currentValue + 10)
                              }}
                            >
                              <PlusCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {supplier.material === "cheese" && (
                        <div className="col-span-2 flex items-center justify-between">
                          <span>Cheese:</span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                const currentValue =
                                  plannedAction.supplierOrders?.find((o) => o.supplierId === supplier.id)
                                    ?.cheesePurchase || 0
                                handleSupplierOrderChange(supplier.id, "cheese", Math.max(0, currentValue - 10))
                              }}
                            >
                              <MinusCircle className="h-3 w-3" />
                            </Button>
                            <span>
                              {plannedAction.supplierOrders?.find((o) => o.supplierId === supplier.id)
                                ?.cheesePurchase || 0}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                const currentValue =
                                  plannedAction.supplierOrders?.find((o) => o.supplierId === supplier.id)
                                    ?.cheesePurchase || 0
                                handleSupplierOrderChange(supplier.id, "cheese", currentValue + 10)
                              }}
                            >
                              <PlusCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {supplier.material === "potato" && (
                        <div className="col-span-2 flex items-center justify-between">
                          <span>Potato:</span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                const currentValue =
                                  plannedAction.supplierOrders?.find((o) => o.supplierId === supplier.id)
                                    ?.potatoPurchase || 0
                                handleSupplierOrderChange(supplier.id, "potato", Math.max(0, currentValue - 10))
                              }}
                            >
                              <MinusCircle className="h-3 w-3" />
                            </Button>
                            <span>
                              {plannedAction.supplierOrders?.find((o) => o.supplierId === supplier.id)
                                ?.potatoPurchase || 0}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                const currentValue =
                                  plannedAction.supplierOrders?.find((o) => o.supplierId === supplier.id)
                                    ?.potatoPurchase || 0
                                handleSupplierOrderChange(supplier.id, "potato", currentValue + 10)
                              }}
                            >
                              <PlusCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
