"use client"

import { ShoppingCart, Package, Factory, MenuIcon as Restaurant, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Supplier, SupplierOrder, CustomerOrderAction, Customer, LevelConfig } from "@/types/game"

interface DailyOrderSummaryProps {
  supplierOrders: SupplierOrder[]
  suppliers: Supplier[]
  getMaterialPriceForSupplier: (supplierId: number, materialType: string) => number
  getDeliveryMultiplier?: () => number
  production?: number
  productionCostPerUnit?: number
  customerOrders?: CustomerOrderAction[]
  customers?: Customer[]
  levelConfig?: LevelConfig
  onResetAllOrders?: () => void
  isDisabled?: boolean
}

export function DailyOrderSummary({
  supplierOrders,
  suppliers,
  getMaterialPriceForSupplier,
  getDeliveryMultiplier = () => 1.0,
  production = 0,
  productionCostPerUnit = 0,
  customerOrders = [],
  customers = [],
  levelConfig,
  onResetAllOrders,
  isDisabled = false,
}: DailyOrderSummaryProps) {
  // Helper function to get supplier name by ID
  const getSupplierName = (supplierId: number): string => {
    const supplier = suppliers.find((s) => s.id === supplierId)
    return supplier ? supplier.name : `Supplier ${supplierId}`
  }

  // Helper function to get supplier by ID
  const getSupplier = (supplierId: number): Supplier | undefined => {
    return suppliers.find((s) => s.id === supplierId)
  }

  // Helper function to get customer by ID
  const getCustomer = (customerId: number): Customer | undefined => {
    return customers.find((c) => c.id === customerId)
  }

  // Helper function to format material names
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

  // Get delivery multiplier
  const deliveryMultiplier = getDeliveryMultiplier()

  // Calculate base cost for a specific material
  const calculateBaseCost = (quantity: number, supplierId: number, materialType: string): number => {
    try {
      // Ensure we have valid inputs
      if (quantity <= 0 || !supplierId || !materialType) return 0

      // Get the price per unit
      const pricePerUnit = getMaterialPriceForSupplier(supplierId, materialType)

      // Check if price is valid
      if (typeof pricePerUnit !== "number" || isNaN(pricePerUnit)) return 0

      // Calculate base cost
      return Math.round(quantity * pricePerUnit * 100) / 100
    } catch (error) {
      console.error(`Error calculating base cost for ${materialType} from supplier ${supplierId}:`, error)
      return 0
    }
  }

  // Calculate shipment cost for a specific material
  const calculateShipmentCost = (quantity: number, supplierId: number, materialType: string): number => {
    try {
      // Ensure we have valid inputs
      if (quantity <= 0 || !supplierId || !materialType) return 0

      const supplier = getSupplier(supplierId)
      if (!supplier) return 0

      // Check if supplier has special shipment prices
      if (
        supplier.shipmentPrices &&
        supplier.shipmentPrices[materialType] &&
        supplier.shipmentPrices[materialType][quantity]
      ) {
        return supplier.shipmentPrices[materialType][quantity]
      }

      // If no special shipment prices, return 0 (base cost only)
      return 0
    } catch (error) {
      console.error(`Error calculating shipment cost for ${materialType} from supplier ${supplierId}:`, error)
      return 0
    }
  }

  // Calculate total cost (base + shipment) for a specific material
  const calculateMaterialTotalCost = (quantity: number, supplierId: number, materialType: string): number => {
    try {
      // Ensure we have valid inputs
      if (quantity <= 0 || !supplierId || !materialType) return 0

      const supplier = getSupplier(supplierId)
      if (!supplier) return 0

      // Check if supplier has special shipment prices
      if (
        supplier.shipmentPrices &&
        supplier.shipmentPrices[materialType] &&
        supplier.shipmentPrices[materialType][quantity]
      ) {
        // If shipment prices include base cost, just return the shipment price
        if (supplier.shipmentPricesIncludeBaseCost) {
          return supplier.shipmentPrices[materialType][quantity]
        }

        // Otherwise, add base cost and shipment cost
        const baseCost = calculateBaseCost(quantity, supplierId, materialType)
        return baseCost + supplier.shipmentPrices[materialType][quantity]
      }

      // If no special shipment prices, calculate with delivery multiplier
      const baseCost = calculateBaseCost(quantity, supplierId, materialType)
      return Math.round(baseCost * deliveryMultiplier * 100) / 100
    } catch (error) {
      console.error(`Error calculating total cost for ${materialType} from supplier ${supplierId}:`, error)
      return 0
    }
  }

  // Calculate total cost for all supplier orders
  const calculateSupplierTotalCost = (): number => {
    try {
      let total = 0

      supplierOrders.forEach((order) => {
        if (!order) return

        const supplier = getSupplier(order.supplierId)
        if (!supplier) return

        // Calculate total for each material
        if (order.pattyPurchase > 0) {
          total += calculateMaterialTotalCost(order.pattyPurchase, order.supplierId, "patty")
        }
        if (order.cheesePurchase > 0) {
          total += calculateMaterialTotalCost(order.cheesePurchase, order.supplierId, "cheese")
        }
        if (order.bunPurchase > 0) {
          total += calculateMaterialTotalCost(order.bunPurchase, order.supplierId, "bun")
        }
        if (order.potatoPurchase > 0) {
          total += calculateMaterialTotalCost(order.potatoPurchase, order.supplierId, "potato")
        }
      })

      // Round to 2 decimal places for consistency
      return Math.round(total * 100) / 100
    } catch (error) {
      console.error("Error calculating total cost:", error)
      return 0
    }
  }

  // Calculate production cost
  const calculateProductionCost = (): number => {
    if (production <= 0 || productionCostPerUnit <= 0) return 0
    return Math.round(production * productionCostPerUnit * 100) / 100
  }

  // Calculate restaurant orders cost/revenue
  const calculateRestaurantOrdersRevenue = (): number => {
    let total = 0

    customerOrders.forEach((order) => {
      if (!order || order.quantity <= 0) return

      const customer = getCustomer(order.customerId)
      if (!customer) return

      // Calculate revenue
      const revenue = order.quantity * customer.pricePerUnit

      // Calculate transport cost
      const transportCost = customer.transportCosts[order.quantity] || 0

      // Calculate net revenue
      const netRevenue = revenue - transportCost

      total += netRevenue
    })

    return Math.round(total * 100) / 100
  }

  // Format currency consistently
  const formatCurrency = (amount: number): string => {
    return `${amount.toFixed(2)} kr`
  }

  // Check if there are any supplier orders
  const hasSupplierOrders =
    supplierOrders?.some(
      (order) =>
        order?.pattyPurchase > 0 || order?.cheesePurchase > 0 || order?.bunPurchase > 0 || order?.potatoPurchase > 0,
    ) ?? false

  // Check if there is production
  const hasProduction = production > 0

  // Check if there are any customer orders
  const hasCustomerOrders = customerOrders?.some((order) => order?.quantity > 0) ?? false

  // Check if there are any orders at all
  const hasAnyOrders = hasSupplierOrders || hasProduction || hasCustomerOrders

  // Handle case where supplierOrders is undefined
  if (!supplierOrders || !Array.isArray(supplierOrders)) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Today's Orders Summary</span>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onResetAllOrders} disabled={isDisabled}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset All Orders
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="mx-auto h-12 w-12 opacity-20 mb-2" />
            <p>No orders available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Today's Orders Summary</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onResetAllOrders} disabled={isDisabled || !hasAnyOrders}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset All Orders
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!hasSupplierOrders && !hasProduction && !hasCustomerOrders ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="mx-auto h-12 w-12 opacity-20 mb-2" />
            <p>No orders selected for today</p>
            <p className="text-sm">Click on suppliers in the map to place orders</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Supplier Orders Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                Supplier Orders
              </h3>

              {hasSupplierOrders ? (
                <div className="space-y-3">
                  {supplierOrders.map((order) => {
                    // Skip if order is invalid or no items ordered from this supplier
                    if (
                      !order ||
                      (order.pattyPurchase === 0 &&
                        order.cheesePurchase === 0 &&
                        order.bunPurchase === 0 &&
                        order.potatoPurchase === 0)
                    ) {
                      return null
                    }

                    const supplier = getSupplier(order.supplierId)
                    if (!supplier) return null

                    // Calculate supplier total
                    let supplierTotal = 0

                    // Calculate totals for each material
                    const pattyTotal =
                      order.pattyPurchase > 0
                        ? calculateMaterialTotalCost(order.pattyPurchase, order.supplierId, "patty")
                        : 0

                    const cheeseTotal =
                      order.cheesePurchase > 0
                        ? calculateMaterialTotalCost(order.cheesePurchase, order.supplierId, "cheese")
                        : 0

                    const bunTotal =
                      order.bunPurchase > 0 ? calculateMaterialTotalCost(order.bunPurchase, order.supplierId, "bun") : 0

                    const potatoTotal =
                      order.potatoPurchase > 0
                        ? calculateMaterialTotalCost(order.potatoPurchase, order.supplierId, "potato")
                        : 0

                    supplierTotal = pattyTotal + cheeseTotal + bunTotal + potatoTotal

                    return (
                      <div key={order.supplierId} className="bg-gray-50 rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-sm">{getSupplierName(order.supplierId)}</h4>
                          <span className="text-sm font-semibold">{formatCurrency(supplierTotal)}</span>
                        </div>
                        <div className="space-y-1">
                          {order.pattyPurchase > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                  {order.pattyPurchase}
                                </Badge>
                                <span>{formatMaterialName("patty")}</span>
                              </div>
                              <span className="font-medium">{formatCurrency(pattyTotal)}</span>
                            </div>
                          )}
                          {order.cheesePurchase > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs"
                                >
                                  {order.cheesePurchase}
                                </Badge>
                                <span>{formatMaterialName("cheese")}</span>
                              </div>
                              <span className="font-medium">{formatCurrency(cheeseTotal)}</span>
                            </div>
                          )}
                          {order.bunPurchase > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                                >
                                  {order.bunPurchase}
                                </Badge>
                                <span>{formatMaterialName("bun")}</span>
                              </div>
                              <span className="font-medium">{formatCurrency(bunTotal)}</span>
                            </div>
                          )}
                          {order.potatoPurchase > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="bg-orange-50 text-orange-700 border-orange-200 text-xs"
                                >
                                  {order.potatoPurchase}
                                </Badge>
                                <span>{formatMaterialName("potato")}</span>
                              </div>
                              <span className="font-medium">{formatCurrency(potatoTotal)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  <div className="flex justify-between items-center text-sm font-medium pt-2 border-t">
                    <span>Supplier Total:</span>
                    <span>{formatCurrency(calculateSupplierTotalCost())}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No supplier orders</div>
              )}
            </div>

            {/* Production Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Factory className="h-4 w-4" />
                Production
              </h3>

              {hasProduction ? (
                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-md p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm">Meals to Produce</h4>
                      <span className="text-sm font-semibold">{formatCurrency(calculateProductionCost())}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                          {production}
                        </Badge>
                        <span>Meals</span>
                      </div>
                      <span className="text-muted-foreground">({formatCurrency(productionCostPerUnit)}/unit)</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm font-medium pt-2 border-t">
                    <span>Production Total:</span>
                    <span>{formatCurrency(calculateProductionCost())}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No production planned</div>
              )}
            </div>

            {/* Restaurant Orders Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Restaurant className="h-4 w-4" />
                Restaurant Orders
              </h3>

              {hasCustomerOrders ? (
                <div className="space-y-3">
                  {customerOrders.map((order) => {
                    // Skip if order is invalid or no quantity
                    if (!order || order.quantity <= 0) return null

                    const customer = getCustomer(order.customerId)
                    if (!customer) return null

                    // Calculate revenue
                    const revenue = order.quantity * customer.pricePerUnit

                    // Calculate transport cost
                    const transportCost = customer.transportCosts[order.quantity] || 0

                    // Calculate net revenue
                    const netRevenue = revenue - transportCost

                    return (
                      <div key={order.customerId} className="bg-green-50 rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-sm">{customer.name}</h4>
                          <span className="text-sm font-semibold text-green-700">+{formatCurrency(netRevenue)}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
                                {order.quantity}
                              </Badge>
                              <span>Meals</span>
                            </div>
                            <span className="font-medium">{formatCurrency(revenue)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Transport Cost:</span>
                            <span className="text-red-600">-{formatCurrency(transportCost)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <div className="flex justify-between items-center text-sm font-medium text-green-700 pt-2 border-t">
                    <span>Restaurant Revenue:</span>
                    <span>+{formatCurrency(calculateRestaurantOrdersRevenue())}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No customer orders</div>
              )}
            </div>
          </div>
        )}

        {deliveryMultiplier !== 1.0 && (
          <div className="text-xs text-muted-foreground text-right mt-4">
            Includes delivery multiplier: {deliveryMultiplier.toFixed(2)}x
          </div>
        )}
      </CardContent>
    </Card>
  )
}
