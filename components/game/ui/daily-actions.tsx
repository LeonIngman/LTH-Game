"use client"

import { useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PurchaseTab } from "./purchase-tab"
import { ProductionTab } from "./production-tab"
import { SalesTab } from "./sales-tab"
import { PATTIES_PER_MEAL, CHEESE_PER_MEAL, BUNS_PER_MEAL, POTATOES_PER_MEAL } from "@/lib/constants"
import type { GameState, LevelConfig, GameAction, SupplierOrder, CustomerOrderAction } from "@/types/game"

interface DailyActionsProps {
  gameState: GameState
  levelConfig: LevelConfig
  action: GameAction
  setAction: (action: GameAction) => void
  supplierOrders: SupplierOrder[]
  setSupplierOrders: (orders: SupplierOrder[]) => void
  customerOrders: CustomerOrderAction[]
  setCustomerOrders: (orders: CustomerOrderAction[]) => void
  selectedDeliveryOption: number
  setSelectedDeliveryOption: (id: number) => void
  isLoading: boolean
  gameEnded: boolean
  handleSupplierOrderChange: (supplierId: number, field: string, value: number) => void
  handleCustomerOrderChange: (customerId: number, quantity: number) => void
}

export function DailyActions({
  gameState,
  levelConfig,
  action,
  setAction,
  supplierOrders,
  setSupplierOrders,
  customerOrders,
  setCustomerOrders,
  selectedDeliveryOption,
  setSelectedDeliveryOption,
  isLoading,
  gameEnded,
  handleSupplierOrderChange,
  handleCustomerOrderChange,
}: DailyActionsProps) {
  const [activeTab, setActiveTab] = useState("purchase")

  // Calculate max production based on available materials
  const maxProductionByPatty = Math.floor(gameState.inventory.patty / PATTIES_PER_MEAL)
  const maxProductionByCheese = Math.floor(gameState.inventory.cheese / CHEESE_PER_MEAL)
  const maxProductionByBun = Math.floor(gameState.inventory.bun / BUNS_PER_MEAL)
  const maxProductionByPotato = Math.floor(gameState.inventory.potato / POTATOES_PER_MEAL)
  const maxProduction = Math.min(
    maxProductionByPatty,
    maxProductionByCheese,
    maxProductionByBun,
    maxProductionByPotato,
    gameState.productionCapacity,
  )

  // Handle production change
  const handleProductionChange = (value: string) => {
    const production = Number.parseInt(value, 10)
    if (!isNaN(production) && production >= 0) {
      setAction({
        ...action,
        production: Math.min(production, maxProduction),
      })
    }
  }

  // Handle sales attempt change
  const handleSalesAttemptChange = (value: string) => {
    const salesAttempt = Number.parseInt(value, 10)
    if (!isNaN(salesAttempt) && salesAttempt >= 0) {
      setAction({
        ...action,
        salesAttempt: Math.min(salesAttempt, gameState.inventory.finishedGoods),
      })
    }
  }

  // Add these functions before the return statement
  const getCustomerProgressPercentage = useCallback(
    (customerId: number): number => {
      const customer = levelConfig.customers?.find((c) => c.id === customerId)
      if (!customer) return 0

      const delivered = gameState.customerDeliveries[customerId] || 0
      return Math.min(100, Math.round((delivered / customer.totalRequirement) * 100))
    },
    [gameState.customerDeliveries, levelConfig.customers],
  )

  const isDeliveryDueSoon = useCallback(
    (customerId: number, day: number): boolean => {
      const customer = levelConfig.customers?.find((c) => c.id === customerId)
      if (!customer) return false

      const schedule = customer.deliverySchedule?.find((s) => s.day === day + 1 || s.day === day + 2)
      return !!schedule
    },
    [levelConfig.customers],
  )

  const isDeliveryOverdue = useCallback(
    (customerId: number, day: number): boolean => {
      const customer = levelConfig.customers?.find((c) => c.id === customerId)
      if (!customer) return false

      const schedule = customer.deliverySchedule?.find((s) => s.day < day)
      return !!schedule
    },
    [levelConfig.customers],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Actions</CardTitle>
        <CardDescription>Manage your supply chain operations for day {gameState.day}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="purchase" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="purchase">Purchase</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
          </TabsList>
          <TabsContent value="purchase" className="space-y-4">
            <PurchaseTab
              levelConfig={levelConfig}
              supplierOrders={supplierOrders}
              selectedDeliveryOption={selectedDeliveryOption}
              setSelectedDeliveryOption={setSelectedDeliveryOption}
              handleSupplierOrderChange={handleSupplierOrderChange}
              isDisabled={isLoading || gameEnded}
            />
          </TabsContent>
          <TabsContent value="production">
            <ProductionTab
              production={action.production}
              maxProduction={maxProduction}
              onProductionChange={handleProductionChange}
              isDisabled={isLoading || gameEnded}
              inventory={gameState.inventory}
            />
          </TabsContent>
          <TabsContent value="sales">
            <SalesTab
              levelConfig={levelConfig}
              customerOrders={customerOrders}
              gameState={gameState}
              isDisabled={isLoading || gameEnded}
              getCustomerProgressPercentage={getCustomerProgressPercentage}
              isDeliveryDueSoon={isDeliveryDueSoon}
              isDeliveryOverdue={isDeliveryOverdue}
              onCustomerOrderChange={handleCustomerOrderChange}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex justify-between">
          <Button
            variant="outline"
            onClick={() =>
              setActiveTab(activeTab === "purchase" ? "production" : activeTab === "production" ? "sales" : "purchase")
            }
          >
            {activeTab === "purchase"
              ? "Next: Production"
              : activeTab === "production"
                ? "Next: Sales"
                : "Back to Purchase"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
