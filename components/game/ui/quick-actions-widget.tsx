"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calculator } from "lucide-react"
import type { LevelConfig, Supplier, SupplierOrder } from "@/types/game"

interface QuickActionsWidgetProps {
  levelConfig: LevelConfig
  getMaterialPriceForSupplier: (supplierId: number, material: string) => number
  currentDay: number
  supplierOrders: SupplierOrder[]
  pendingOrders: any[]
  onEnablePlanningMode?: () => void
  planningMode?: boolean
}

export function QuickActionsWidget({
  levelConfig,
  getMaterialPriceForSupplier,
  currentDay,
  supplierOrders,
  pendingOrders,
  onEnablePlanningMode,
  planningMode = false,
}: QuickActionsWidgetProps) {
  const [activeTab, setActiveTab] = useState("suppliers")

  // Calculate remaining capacity for a supplier
  const calculateRemainingCapacity = (supplier: Supplier) => {
    // Find current order for this supplier
    const currentOrder = supplierOrders.find((order) => order.supplierId === supplier.id)

    // Calculate total units ordered
    let totalOrdered = 0
    if (currentOrder) {
      if (supplier.material === "patty") totalOrdered += currentOrder.pattyPurchase || 0
      if (supplier.material === "bun") totalOrdered += currentOrder.bunPurchase || 0
      if (supplier.material === "cheese") totalOrdered += currentOrder.cheesePurchase || 0
      if (supplier.material === "potato") totalOrdered += currentOrder.potatoPurchase || 0
    }

    // Find pending orders for this supplier
    const pendingOrdersForSupplier = pendingOrders.filter((order) => order.supplierId === supplier.id)

    // Add pending orders to total
    for (const order of pendingOrdersForSupplier) {
      if (supplier.material === "patty") totalOrdered += order.pattyQuantity || 0
      if (supplier.material === "bun") totalOrdered += order.bunQuantity || 0
      if (supplier.material === "cheese") totalOrdered += order.cheeseQuantity || 0
      if (supplier.material === "potato") totalOrdered += order.potatoQuantity || 0
    }

    // Return remaining capacity
    return Math.max(0, supplier.capacity - totalOrdered)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Quick Reference</CardTitle>
          {onEnablePlanningMode && (
            <Button size="sm" variant="outline" onClick={onEnablePlanningMode} disabled={planningMode}>
              <Calculator className="h-4 w-4 mr-1" />
              Plan
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="suppliers" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers" className="space-y-4">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {levelConfig.suppliers.map((supplier) => (
                <div key={supplier.id} className="border rounded-md p-2">
                  <div className="font-medium text-sm mb-1">{supplier.name}</div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div>Material:</div>
                    <div className="text-right capitalize">{supplier.material}</div>

                    <div>Lead Time:</div>
                    <div className="text-right">
                      {supplier.leadTime} day{supplier.leadTime !== 1 ? "s" : ""}
                    </div>

                    <div>Capacity:</div>
                    <div className="text-right">{supplier.capacity} units</div>

                    <div>Remaining:</div>
                    <div className="text-right">
                      {calculateRemainingCapacity(supplier)} units
                      {calculateRemainingCapacity(supplier) < supplier.capacity / 4 && (
                        <Badge variant="destructive" className="ml-1">
                          Low
                        </Badge>
                      )}
                    </div>

                    <div>Price:</div>
                    <div className="text-right">
                      {getMaterialPriceForSupplier(supplier.id, supplier.material).toFixed(2)} kr
                    </div>

                    {supplier.transportCost && (
                      <>
                        <div>Transport:</div>
                        <div className="text-right">{supplier.transportCost.toFixed(2)} kr</div>
                      </>
                    )}

                    {supplier.shipmentSize && (
                      <>
                        <div>Shipment Size:</div>
                        <div className="text-right">{supplier.shipmentSize} units</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            {levelConfig.customers && levelConfig.customers.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {levelConfig.customers.map((customer) => (
                  <div key={customer.id} className="border rounded-md p-2">
                    <div className="font-medium text-sm mb-1">{customer.name}</div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {customer.totalRequirement && (
                        <>
                          <div>Total Requirement:</div>
                          <div className="text-right">{customer.totalRequirement} units</div>
                        </>
                      )}

                      {customer.dailyRequirement && (
                        <>
                          <div>Daily Requirement:</div>
                          <div className="text-right">{customer.dailyRequirement} units</div>
                        </>
                      )}

                      {customer.demand && typeof customer.demand === "function" && (
                        <>
                          <div>Current Demand:</div>
                          <div className="text-right">{customer.demand(currentDay)} units</div>
                        </>
                      )}

                      {customer.transportCost && (
                        <>
                          <div>Transport Cost:</div>
                          <div className="text-right">{customer.transportCost.toFixed(2)} kr</div>
                        </>
                      )}

                      {customer.pricePerUnit && (
                        <>
                          <div>Price Per Unit:</div>
                          <div className="text-right">{customer.pricePerUnit.toFixed(2)} kr</div>
                        </>
                      )}

                      {customer.orderQuantities && (
                        <>
                          <div>Order Quantities:</div>
                          <div className="text-right">{customer.orderQuantities.join(", ")} units</div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No customer information available for this level.</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
