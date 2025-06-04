"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calculator } from "lucide-react"
import type { Supplier, MaterialType } from "@/types/game"
import type { QuickReferenceProps } from "@/types/components"

const MATERIALS = ["patty", "cheese", "bun", "potato"] as const

export function QuickReference({
  levelConfig,
  getMaterialPriceForSupplier,
  currentDay,
  supplierOrders,
  pendingOrders,
  gameState,
  onEnablePlanningMode,
  planningMode = false,
}: QuickReferenceProps) {
  const [activeTab, setActiveTab] = useState("suppliers")

  const getSupplierMaterials = (supplier: Supplier) => {
    if (Array.isArray(supplier.materials) && supplier.materials.length > 0) {
      return supplier.materials
    }
    return MATERIALS
  }

  // Defensive: fallback to empty object if undefined
  const supplierDeliveries = gameState?.supplierDeliveries || {}

  const calculateRemainingCapacity = (supplier: Supplier, material: MaterialType) => {
    const lifetimeCapacity =
      (supplier.capacityPerGame && supplier.capacityPerGame[material]) ?? 0

    // Defensive: fallback to 0 if undefined
    const deliveredSoFar = supplierDeliveries[supplier.id]?.[material] || 0

    const stagedOrder =
      supplierOrders.find((order) => order.supplierId === supplier.id)?.[`${material}Purchase`] || 0

    return Math.max(0, lifetimeCapacity - deliveredSoFar - stagedOrder)
  }

  const getMaterialCapacity = (supplier: Supplier, material: MaterialType) => {
    if (typeof supplier.capacityPerGame === "object") {
      return supplier.capacityPerGame[material] || 0
    }
    return supplier.capacityPerGame || 0
  }

  return (
    <Card className="h-full" data-tutorial="quick-actions">
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
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div className="font-semibold">Material</div>
                    <div className="font-semibold text-right">Remaining</div>
                    <div className="font-semibold text-right">Price</div>
                    {getSupplierMaterials(supplier).map((material: MaterialType) => {
                      const remaining = calculateRemainingCapacity(supplier, material)
                      if (remaining === 0) return null // Hide materials with 0 remaining
                      return (
                        <React.Fragment key={material}>
                          <div className="capitalize">{material}</div>
                          <div className="text-right">
                            {remaining} units
                            {remaining < (getMaterialCapacity(supplier, material) / 4) && (
                              <Badge variant="destructive" className="ml-1">
                                Low
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            {getMaterialPriceForSupplier(supplier.id, material).toFixed(2)} kr
                          </div>
                        </React.Fragment>
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs mt-2">
                    <div>Lead Time:</div>
                    <div className="text-right">
                      {supplier.leadTime} day{supplier.leadTime !== 1 ? "s" : ""}
                    </div>
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

                      {/* {customer.dailyRequirement && (
                        <>
                          <div>Daily Requirement:</div>
                          <div className="text-right">{customer.dailyRequirement} units</div>
                        </>
                      )} */}

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

                      <div>Delivered:</div>
                      <div className="text-right">
                        {gameState.customerDeliveries?.[customer.id] || 0} units
                      </div>
                      <div>Lead Time:</div>
                        <div className="text-right">
                          {customer.leadTime} day{customer.leadTime !== 1 ? "s" : ""}
                          {customer.randomLeadTime && customer.leadTimeRange && (
                            <Badge variant="outline" className="ml-1 text-xs">
                              Random: {customer.leadTimeRange.join("-")} days
                            </Badge>
                          )}
                        </div>
                        {customer.allowedShipmentSizes && (
                          <>
                            <div>Allowed Shipments:</div>
                            <div className="text-right">{customer.allowedShipmentSizes.join(", ")} units</div>
                          </>
                        )}
                        {/* Add delivery schedule section if it exists */}
                        {customer.deliverySchedule && customer.deliverySchedule.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="font-medium text-xs mb-1 text-blue-700">Delivery Schedule:</div>
                            <div className="space-y-1">
                              {customer.deliverySchedule.map((milestone, index) => {
                                const isPast = milestone.day < currentDay
                                const isCurrent = milestone.day === currentDay
                                const isFuture = milestone.day > currentDay

                                return (
                                  <div
                                    key={index}
                                    className={`flex justify-between items-center text-xs ${
                                      isPast ? "text-gray-500" : isCurrent ? "text-orange-600 font-medium" : "text-gray-700"
                                    }`}
                                  >
                                    <span>Day {milestone.day}:</span>
                                    <span>{milestone.requiredAmount} units</span>
                                    {isCurrent && (
                                      <Badge
                                        variant="outline"
                                        className="ml-1 text-xs bg-orange-50 text-orange-700 border-orange-200"
                                      >
                                        Due Today
                                      </Badge>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
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
