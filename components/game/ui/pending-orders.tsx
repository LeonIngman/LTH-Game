"use client"

import { Package, Truck, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { PendingOrdersProps } from "@/types/components"

export function PendingOrders({ pendingOrders, pendingCustomerOrders, currentDay }: PendingOrdersProps) {
  const formatMaterialName = (material: string): string => {
    switch (material) {
      case "patty":
        return "Burger Patties"
      case "cheese":
        return "Cheese Slices"
      case "bun":
        return "Burger Buns"
      case "potato":
        return "Potatoes"
      default:
        return material
    }
  }

  const formatCurrency = (amount: number): string => {
    return `${amount.toFixed(2)} kr`
  }

  const getETA = (daysRemaining: number): string => {
    const arrivalDay = currentDay + daysRemaining
    return `Day ${arrivalDay}`
  }

  const getETD = (daysRemaining: number): string => {
    const departureDay = currentDay + daysRemaining
    return `Day ${departureDay}`
  }

  const hasOrders = pendingOrders.length > 0 || pendingCustomerOrders.length > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Current Orders
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track your incoming materials (ETA) and outgoing deliveries (ETD)
        </p>
      </CardHeader>
      <CardContent>
        {!hasOrders ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="mx-auto h-12 w-12 opacity-20 mb-2" />
            <p>No pending orders</p>
            <p className="text-sm">Orders will appear here when placed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Incoming Materials (Supplier Orders) */}
            {pendingOrders.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  Incoming Materials
                </h3>
                <div className="space-y-2">
                  {pendingOrders.map((order, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                            {order.quantity}
                          </Badge>
                          <span className="font-medium text-sm">{formatMaterialName(order.materialType)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          From: {order.supplierName} • {order.deliveryName}
                        </div>
                        <div className="text-xs text-muted-foreground">Cost: {formatCurrency(order.totalCost)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-700">ETA: {getETA(order.daysRemaining)}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.daysRemaining} {order.daysRemaining === 1 ? "day" : "days"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outgoing Deliveries (Customer Orders) */}
            {pendingCustomerOrders.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-green-600" />
                  Outgoing Deliveries
                </h3>
                <div className="space-y-2">
                  {pendingCustomerOrders.map((order, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                            {order.quantity}
                          </Badge>
                          <span className="font-medium text-sm">Finished Meals</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Revenue: {formatCurrency(order.totalRevenue)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Transport: {formatCurrency(order.transportCost)}
                        </div>
                        <div className="text-xs text-green-600 font-medium">
                          Net: {formatCurrency(order.netRevenue)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-700">ETD: {getETD(order.daysRemaining)}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.daysRemaining} {order.daysRemaining === 1 ? "day" : "days"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
