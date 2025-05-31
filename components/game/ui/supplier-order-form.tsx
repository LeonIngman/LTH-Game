"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Supplier, SupplierOrder } from "@/types/game"

interface SupplierOrderFormProps {
  supplier: Supplier
  supplierOrder: SupplierOrder
  orderQuantities: number[]
  onOrderChange: (supplierId: number, field: keyof SupplierOrder, value: number) => void
  getMaterialPriceForSupplier: (supplierId: number, materialType: string) => number
  getMaterialCapacity?: (supplier: any, materialType: string) => number
  isMaterialAvailable?: (supplierId: number, materialType: string) => boolean
  disabled: boolean
}

export function SupplierOrderForm({
  supplier,
  supplierOrder,
  orderQuantities,
  onOrderChange,
  getMaterialPriceForSupplier,
  getMaterialCapacity,
  isMaterialAvailable,
  disabled,
}: SupplierOrderFormProps) {
  // Default implementation for isMaterialAvailable if not provided
  const checkMaterialAvailability = (supplierId: number, materialType: string): boolean => {
    if (isMaterialAvailable) {
      return isMaterialAvailable(supplierId, materialType)
    }

    // Default implementation: check if the supplier has capacity for this material
    if (typeof supplier.capacityPerDay === "object") {
      return supplier.capacityPerDay[materialType] > 0
    }
    return true // If not specified, assume material is available
  }

  // Default implementation for getMaterialCapacity if not provided
  const getCapacity = (supplier: any, materialType: string): number => {
    if (getMaterialCapacity) {
      return getMaterialCapacity(supplier, materialType)
    }

    // Default implementation: get capacity from supplier
    if (typeof supplier.capacityPerDay === "object") {
      return supplier.capacityPerDay[materialType] || 0
    }
    return supplier.capacityPerDay || 0
  }

  // Helper function to get material-specific order quantities from shipmentPrices
  const getMaterialOrderQuantities = (materialType: string): number[] => {
    // Always include 0 as an option
    const baseQuantities = [0]

    // If supplier has shipmentPrices for this material, use those quantities
    if (supplier.shipmentPrices && supplier.shipmentPrices[materialType]) {
      const availableQuantities = Object.keys(supplier.shipmentPrices[materialType])
        .map((qty) => Number(qty))
        .sort((a, b) => a - b)

      return [...baseQuantities, ...availableQuantities]
    }

    // Otherwise use the provided orderQuantities
    return orderQuantities
  }

  // Helper function to get base cost for a specific material and quantity
  const getBaseCost = (materialType: string, quantity: number): number => {
    const pricePerUnit = getMaterialPriceForSupplier(supplier.id, materialType)
    return quantity * pricePerUnit
  }

  // Helper function to get shipment cost for a specific material and quantity
  const getShipmentCost = (materialType: string, quantity: number): number => {
    if (
      supplier.shipmentPrices &&
      supplier.shipmentPrices[materialType] &&
      supplier.shipmentPrices[materialType][quantity]
    ) {
      return supplier.shipmentPrices[materialType][quantity]
    }
    return 0
  }

  // Helper function to get total cost (base + shipment) for a specific material and quantity
  const getTotalCost = (materialType: string, quantity: number): number => {
    const baseCost = getBaseCost(materialType, quantity)
    const shipmentCost = getShipmentCost(materialType, quantity)

    // If supplier uses shipment prices, they already include the base cost
    if (
      supplier.shipmentPrices &&
      supplier.shipmentPrices[materialType] &&
      supplier.shipmentPrices[materialType][quantity]
    ) {
      return shipmentCost
    }

    // Otherwise, add base cost and shipment cost
    return baseCost + shipmentCost
  }

  // Calculate remaining capacity for each material type
  // For this example, we'll assume the supplier has a fixed total capacity for the level
  // and we'll show how much is remaining
  const getRemainingCapacity = (materialType: string): number => {
    // This would normally come from the game state tracking total purchases
    // For now, we'll use a placeholder value of 75% remaining
    const totalCapacity = getCapacity(supplier, materialType)
    const usedCapacity = Math.floor(totalCapacity * 0.25) // Placeholder: 25% used
    return totalCapacity - usedCapacity
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="p-3 bg-gray-50 rounded-md mb-2">
        <h4 className="font-medium">{supplier.name}</h4>
        <p className="text-sm text-gray-600">{supplier.description}</p>
        <p className="text-xs text-gray-500 mt-1">
          {supplier.randomLeadTime ? (
            <span>Lead time: {supplier.leadTimeRange?.join(", ")} days (varies due to uncertainty)</span>
          ) : (
            <span>
              Lead time: {supplier.leadTime} {supplier.leadTime === 1 ? "day" : "days"}
            </span>
          )}
        </p>

        {typeof supplier.capacityPerDay === "object" && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="text-xs">
              <span className="text-gray-500">Patty: </span>
              <span className={getRemainingCapacity("patty") < 10 ? "text-red-500" : ""}>
                {getRemainingCapacity("patty")} units remaining
              </span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500">Cheese: </span>
              <span className={getRemainingCapacity("cheese") < 10 ? "text-red-500" : ""}>
                {getRemainingCapacity("cheese")} units remaining
              </span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500">Bun: </span>
              <span className={getRemainingCapacity("bun") < 10 ? "text-red-500" : ""}>
                {getRemainingCapacity("bun")} units remaining
              </span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500">Potato: </span>
              <span className={getRemainingCapacity("potato") < 10 ? "text-red-500" : ""}>
                {getRemainingCapacity("potato")} units remaining
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Patty Purchase - Only show if available */}
      {checkMaterialAvailability(supplier.id, "patty") && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor={`patty-${supplier.id}`}>
              Patties ({getMaterialPriceForSupplier(supplier.id, "patty").toFixed(2)} kr/unit)
            </Label>
            <span className="text-xs text-gray-500">{getRemainingCapacity("patty")} units remaining</span>
          </div>

          {/* Shipment costs table */}
          {supplier.shipmentPrices && (
            <div className="mb-2 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-1 border">Quantity</th>
                    <th className="p-1 border">Shipment Cost (kr)</th>
                    {!supplier.shipmentPricesIncludeBaseCost && <th className="p-1 border">Total Cost (kr)</th>}
                  </tr>
                </thead>
                <tbody>
                  {getMaterialOrderQuantities("patty")
                    .filter((qty) => qty > 0)
                    .map((qty) => {
                      const shipmentCost = getShipmentCost("patty", qty)
                      const baseCost = getBaseCost("patty", qty)
                      const totalCost = supplier.shipmentPricesIncludeBaseCost ? shipmentCost : baseCost + shipmentCost

                      return (
                        <tr key={qty} className={supplierOrder.pattyPurchase === qty ? "bg-blue-50" : ""}>
                          <td className="p-1 border text-center">{qty}</td>
                          <td className="p-1 border text-center">{shipmentCost.toFixed(2)}</td>
                          {!supplier.shipmentPricesIncludeBaseCost && (
                            <td className="p-1 border text-center">{totalCost.toFixed(2)}</td>
                          )}
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <RadioGroup
              value={supplierOrder.pattyPurchase.toString()}
              onValueChange={(value) => onOrderChange(supplier.id, "pattyPurchase", Number.parseInt(value))}
              className="flex space-x-2"
              disabled={disabled}
            >
              <div className="flex flex-wrap gap-2">
                {getMaterialOrderQuantities("patty").map((qty) => (
                  <div key={qty} className="flex items-center space-x-1">
                    <RadioGroupItem
                      value={qty.toString()}
                      id={`patty-${supplier.id}-${qty}`}
                      disabled={qty > getRemainingCapacity("patty") || disabled}
                    />
                    <Label htmlFor={`patty-${supplier.id}-${qty}`}>{qty}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        </div>
      )}

      {/* Cheese Purchase - Only show if available */}
      {checkMaterialAvailability(supplier.id, "cheese") && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor={`cheese-${supplier.id}`}>
              Cheese ({getMaterialPriceForSupplier(supplier.id, "cheese").toFixed(2)} kr/unit)
            </Label>
            <span className="text-xs text-gray-500">{getRemainingCapacity("cheese")} units remaining</span>
          </div>

          {/* Shipment costs table */}
          {supplier.shipmentPrices && (
            <div className="mb-2 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-1 border">Quantity</th>
                    <th className="p-1 border">Shipment Cost (kr)</th>
                    {!supplier.shipmentPricesIncludeBaseCost && <th className="p-1 border">Total Cost (kr)</th>}
                  </tr>
                </thead>
                <tbody>
                  {getMaterialOrderQuantities("cheese")
                    .filter((qty) => qty > 0)
                    .map((qty) => {
                      const shipmentCost = getShipmentCost("cheese", qty)
                      const baseCost = getBaseCost("cheese", qty)
                      const totalCost = supplier.shipmentPricesIncludeBaseCost ? shipmentCost : baseCost + shipmentCost

                      return (
                        <tr key={qty} className={supplierOrder.cheesePurchase === qty ? "bg-blue-50" : ""}>
                          <td className="p-1 border text-center">{qty}</td>
                          <td className="p-1 border text-center">{shipmentCost.toFixed(2)}</td>
                          {!supplier.shipmentPricesIncludeBaseCost && (
                            <td className="p-1 border text-center">{totalCost.toFixed(2)}</td>
                          )}
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <RadioGroup
              value={supplierOrder.cheesePurchase.toString()}
              onValueChange={(value) => onOrderChange(supplier.id, "cheesePurchase", Number.parseInt(value))}
              className="flex space-x-2"
              disabled={disabled}
            >
              <div className="flex flex-wrap gap-2">
                {getMaterialOrderQuantities("cheese").map((qty) => (
                  <div key={qty} className="flex items-center space-x-1">
                    <RadioGroupItem
                      value={qty.toString()}
                      id={`cheese-${supplier.id}-${qty}`}
                      disabled={qty > getRemainingCapacity("cheese") || disabled}
                    />
                    <Label htmlFor={`cheese-${supplier.id}-${qty}`}>{qty}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        </div>
      )}

      {/* Bun Purchase - Only show if available */}
      {checkMaterialAvailability(supplier.id, "bun") && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor={`bun-${supplier.id}`}>
              Buns ({getMaterialPriceForSupplier(supplier.id, "bun").toFixed(2)} kr/unit)
            </Label>
            <span className="text-xs text-gray-500">{getRemainingCapacity("bun")} units remaining</span>
          </div>

          {/* Shipment costs table */}
          {supplier.shipmentPrices && (
            <div className="mb-2 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-1 border">Quantity</th>
                    <th className="p-1 border">Shipment Cost (kr)</th>
                    {!supplier.shipmentPricesIncludeBaseCost && <th className="p-1 border">Total Cost (kr)</th>}
                  </tr>
                </thead>
                <tbody>
                  {getMaterialOrderQuantities("bun")
                    .filter((qty) => qty > 0)
                    .map((qty) => {
                      const shipmentCost = getShipmentCost("bun", qty)
                      const baseCost = getBaseCost("bun", qty)
                      const totalCost = supplier.shipmentPricesIncludeBaseCost ? shipmentCost : baseCost + shipmentCost

                      return (
                        <tr key={qty} className={supplierOrder.bunPurchase === qty ? "bg-blue-50" : ""}>
                          <td className="p-1 border text-center">{qty}</td>
                          <td className="p-1 border text-center">{shipmentCost.toFixed(2)}</td>
                          {!supplier.shipmentPricesIncludeBaseCost && (
                            <td className="p-1 border text-center">{totalCost.toFixed(2)}</td>
                          )}
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <RadioGroup
              value={supplierOrder.bunPurchase.toString()}
              onValueChange={(value) => onOrderChange(supplier.id, "bunPurchase", Number.parseInt(value))}
              className="flex space-x-2"
              disabled={disabled}
            >
              <div className="flex flex-wrap gap-2">
                {getMaterialOrderQuantities("bun").map((qty) => (
                  <div key={qty} className="flex items-center space-x-1">
                    <RadioGroupItem
                      value={qty.toString()}
                      id={`bun-${supplier.id}-${qty}`}
                      disabled={qty > getRemainingCapacity("bun") || disabled}
                    />
                    <Label htmlFor={`bun-${supplier.id}-${qty}`}>{qty}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        </div>
      )}

      {/* Potato Purchase - Only show if available */}
      {checkMaterialAvailability(supplier.id, "potato") && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor={`potato-${supplier.id}`}>
              Potatoes ({getMaterialPriceForSupplier(supplier.id, "potato").toFixed(2)} kr/unit)
            </Label>
            <span className="text-xs text-gray-500">{getRemainingCapacity("potato")} units remaining</span>
          </div>

          {/* Shipment costs table */}
          {supplier.shipmentPrices && (
            <div className="mb-2 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-1 border">Quantity</th>
                    <th className="p-1 border">Shipment Cost (kr)</th>
                    {!supplier.shipmentPricesIncludeBaseCost && <th className="p-1 border">Total Cost (kr)</th>}
                  </tr>
                </thead>
                <tbody>
                  {getMaterialOrderQuantities("potato")
                    .filter((qty) => qty > 0)
                    .map((qty) => {
                      const shipmentCost = getShipmentCost("potato", qty)
                      const baseCost = getBaseCost("potato", qty)
                      const totalCost = supplier.shipmentPricesIncludeBaseCost ? shipmentCost : baseCost + shipmentCost

                      return (
                        <tr key={qty} className={supplierOrder.potatoPurchase === qty ? "bg-blue-50" : ""}>
                          <td className="p-1 border text-center">{qty}</td>
                          <td className="p-1 border text-center">{shipmentCost.toFixed(2)}</td>
                          {!supplier.shipmentPricesIncludeBaseCost && (
                            <td className="p-1 border text-center">{totalCost.toFixed(2)}</td>
                          )}
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <RadioGroup
              value={supplierOrder.potatoPurchase.toString()}
              onValueChange={(value) => onOrderChange(supplier.id, "potatoPurchase", Number.parseInt(value))}
              className="flex space-x-2"
              disabled={disabled}
            >
              <div className="flex flex-wrap gap-2">
                {getMaterialOrderQuantities("potato").map((qty) => (
                  <div key={qty} className="flex items-center space-x-1">
                    <RadioGroupItem
                      value={qty.toString()}
                      id={`potato-${supplier.id}-${qty}`}
                      disabled={qty > getRemainingCapacity("potato") || disabled}
                    />
                    <Label htmlFor={`potato-${supplier.id}-${qty}`}>{qty}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        </div>
      )}

      <div className="text-right">
        Total for {supplier.name}: {calculateSupplierOrderTotal(supplier, supplierOrder, getMaterialPriceForSupplier)}{" "}
        kr
      </div>
    </div>
  )
}

// Helper function to calculate total cost for a specific supplier order
function calculateSupplierOrderTotal(
  supplier: Supplier,
  order: SupplierOrder,
  getMaterialPriceForSupplier: (supplierId: number, materialType: string) => number,
): string {
  let total = 0

  // Calculate base costs
  const pattyBaseCost = order.pattyPurchase * getMaterialPriceForSupplier(supplier.id, "patty")
  const cheeseBaseCost = order.cheesePurchase * getMaterialPriceForSupplier(supplier.id, "cheese")
  const bunBaseCost = order.bunPurchase * getMaterialPriceForSupplier(supplier.id, "bun")
  const potatoBaseCost = order.potatoPurchase * getMaterialPriceForSupplier(supplier.id, "potato")

  // If supplier has specific shipment prices, use those
  if (supplier.shipmentPrices) {
    let shipmentTotal = 0

    if (order.pattyPurchase > 0 && supplier.shipmentPrices.patty[order.pattyPurchase]) {
      shipmentTotal += supplier.shipmentPrices.patty[order.pattyPurchase]
    }
    if (order.bunPurchase > 0 && supplier.shipmentPrices.bun[order.bunPurchase]) {
      shipmentTotal += supplier.shipmentPrices.bun[order.bunPurchase]
    }
    if (order.cheesePurchase > 0 && supplier.shipmentPrices.cheese[order.cheesePurchase]) {
      shipmentTotal += supplier.shipmentPrices.cheese[order.cheesePurchase]
    }
    if (order.potatoPurchase > 0 && supplier.shipmentPrices.potato[order.potatoPurchase]) {
      shipmentTotal += supplier.shipmentPrices.potato[order.potatoPurchase]
    }

    // If shipment prices already include base cost, just use shipment total
    if (supplier.shipmentPricesIncludeBaseCost) {
      total = shipmentTotal
    } else {
      // Otherwise, add base costs and shipment costs
      total = pattyBaseCost + cheeseBaseCost + bunBaseCost + potatoBaseCost + shipmentTotal
    }
  } else {
    // No shipment prices, just use base costs
    total = pattyBaseCost + cheeseBaseCost + bunBaseCost + potatoBaseCost
  }

  return total.toFixed(2)
}
