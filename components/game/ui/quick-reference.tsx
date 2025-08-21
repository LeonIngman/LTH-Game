"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calculator } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import type { Supplier, MaterialType } from "@/types/game"
import type { QuickReferenceProps } from "@/types/components"

const MATERIALS = ["patty", "cheese", "bun", "potato"] as const

export function QuickReference({
  levelConfig,
  getMaterialPriceForSupplier,
  currentDay,
  supplierOrders,
  gameState,
  onEnablePlanningMode,
  planningMode = false,
}: Readonly<QuickReferenceProps>) {
  const [activeTab, setActiveTab] = useState("suppliers")
  const { translations } = useTranslation()

  const getSupplierMaterials = (supplier: Supplier) => {
    if (Array.isArray(supplier.materials) && supplier.materials.length > 0) {
      return supplier.materials
    }
    return MATERIALS
  }

  // Defensive: fallback to empty object if undefined
  const supplierDeliveries = gameState?.supplierDeliveries || {}

  const calculateRemainingCapacity = (supplier: Supplier, material: MaterialType) => {
    const lifetimeCapacity = supplier.capacityPerGame?.[material] ?? 0

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

  const getMaterialName = (material: MaterialType) => {
    switch (material) {
      case 'patty':
        return translations.game.patty
      case 'cheese':
        return translations.game.cheese
      case 'bun':
        return translations.game.bun
      case 'potato':
        return translations.game.potato
      default:
        return material
    }
  }

  return (
    <Card className="h-full" data-tutorial="quick-actions">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>{translations.game.quickReference}</CardTitle>
          {onEnablePlanningMode && (
            <Button size="sm" variant="outline" onClick={onEnablePlanningMode} disabled={planningMode}>
              <Calculator className="h-4 w-4 mr-1" />
              {translations.game.plan}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="suppliers" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="suppliers">{translations.game.suppliers}</TabsTrigger>
            <TabsTrigger value="customers">{translations.game.customers}</TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers" className="space-y-4">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {levelConfig.suppliers.map((supplier) => (
                <div key={supplier.id} className="border rounded-md p-2">
                  <div className="font-medium text-sm mb-1">{supplier.name}</div>
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div className="font-semibold">{translations.game.material}</div>
                    <div className="font-semibold text-right">{translations.game.remaining}</div>
                    <div className="font-semibold text-right">{translations.game.price}</div>
                    {getSupplierMaterials(supplier).map((material: MaterialType) => {
                      const remaining = calculateRemainingCapacity(supplier, material)
                      if (remaining === 0) return null // Hide materials with 0 remaining
                      return (
                        <React.Fragment key={material}>
                          <div>{getMaterialName(material)}</div>
                          <div className="text-right">
                            {remaining} {translations.game.units}
                            {remaining < (getMaterialCapacity(supplier, material) / 4) && (
                              <Badge variant="destructive" className="ml-1">
                                {translations.game.low}
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
                    <div>{translations.game.leadTime}:</div>
                    <div className="text-right">
                      {supplier.leadTime} {supplier.leadTime !== 1 ? translations.game.days : translations.game.day}
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
                      {!!customer.totalRequirement && (
                        <>
                          <div>{translations.game.totalRequirement}:</div>
                          <div className="text-right">{customer.totalRequirement} {translations.game.units}</div>
                        </>
                      )}

                      {!!customer.pricePerUnit && (
                        <>
                          <div>{translations.game.pricePerUnit}:</div>
                          <div className="text-right">{customer.pricePerUnit.toFixed(2)} kr</div>
                        </>
                      )}

                      <div>{translations.game.delivered}:</div>
                      <div className="text-right">
                        {gameState.customerDeliveries?.[customer.id] || 0} {translations.game.units}
                      </div>
                      <div>{translations.game.leadTime}:</div>
                      <div className="text-right">
                        {customer.leadTime} {customer.leadTime !== 1 ? translations.game.days : translations.game.day}
                        {customer.randomLeadTime && customer.leadTimeRange && (
                          <Badge variant="outline" className="ml-1 text-xs">
                            {translations.game.random}: {customer.leadTimeRange.join("-")} {translations.game.days}
                          </Badge>
                        )}
                      </div>
                      {customer.allowedShipmentSizes && (
                        <>
                          <div>{translations.game.allowedShipments}:</div>
                          <div className="text-right">{customer.allowedShipmentSizes.join(", ")} {translations.game.units}</div>
                        </>
                      )}
                      {/* Add delivery schedule section if it exists */}
                      {customer.deliverySchedule && customer.deliverySchedule.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="font-medium text-xs mb-1 text-blue-700">{translations.game.deliverySchedule}:</div>
                          <div className="space-y-1">
                            {customer.deliverySchedule.map((milestone, index) => {
                              const isPast = milestone.day < currentDay
                              const isCurrent = milestone.day === currentDay

                              if (isCurrent) {
                                // Calculate cumulative required amount up to current day
                                const cumulativeRequired = customer.deliverySchedule
                                  .filter((item) => item.day <= currentDay)
                                  .reduce((sum, curr) => sum + curr.requiredAmount, 0)

                                // Get total delivered to date from database
                                const totalDelivered = gameState.customerDeliveries?.[customer.id] || 0

                                // Check if user is on track
                                const isOnTrack = totalDelivered >= cumulativeRequired

                                // Special formatting for current day with dynamic badge based on delivery status
                                return (
                                  <div
                                    key={`current-${milestone.day}`}
                                    className={`${isOnTrack
                                      ? "bg-green-50 border border-green-200"
                                      : "bg-orange-50 border border-orange-200"
                                      } rounded-md p-2 text-xs`}
                                  >
                                    <div className="flex items-center gap-1 mb-1">
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${isOnTrack
                                          ? "bg-green-100 text-green-700 border-green-300"
                                          : "bg-orange-100 text-orange-700 border-orange-300"
                                          }`}
                                      >
                                        {isOnTrack ? translations.game.onTrack : translations.game.dueToday}
                                      </Badge>
                                    </div>
                                    <div className={`font-medium ${isOnTrack ? "text-green-800" : "text-orange-800"
                                      }`}>
                                      {translations.game.day} {milestone.day}: {milestone.requiredAmount} {translations.game.units}
                                    </div>
                                    {isOnTrack && (
                                      <div className="text-green-700 text-xs mt-1">
                                        {translations.game.delivered}: {totalDelivered} / {cumulativeRequired} {translations.game.units}
                                      </div>
                                    )}
                                  </div>
                                )
                              }

                              return (
                                <div
                                  key={`milestone-${milestone.day}`}
                                  className={`flex justify-between items-center text-xs ${isPast ? "text-gray-500" : "text-gray-700"
                                    }`}
                                >
                                  <span>{translations.game.day} {milestone.day}:</span>
                                  <span>{milestone.requiredAmount} {translations.game.units}</span>
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
              <div className="text-sm text-muted-foreground">{translations.game.noCustomerInfo}</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
