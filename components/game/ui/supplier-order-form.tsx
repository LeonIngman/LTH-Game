"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Supplier, SupplierOrder, GameState } from "@/types/game"

interface SupplierOrderFormProps {
  supplier: Supplier
  supplierOrder: SupplierOrder
  orderQuantities: number[]
  onOrderChange: (supplierId: number, field: keyof SupplierOrder, value: number) => void
  getMaterialPriceForSupplier: (supplierId: number, materialType: string) => number
  getMaterialCapacity?: (supplier: any, materialType: string) => number
  isMaterialAvailable?: (supplierId: number, materialType: string) => boolean
  disabled: boolean
  gameState?: GameState // <-- Add this line if you want to pass gameState directly
  supplierDeliveries?: Record<number, Record<string, number>> // <-- Or pass just the deliveries
}

const MATERIALS = [
  { key: "patty", label: "Patties" },
  { key: "cheese", label: "Cheese" },
  { key: "bun", label: "Buns" },
  { key: "potato", label: "Potatoes" },
] as const

export function SupplierOrderForm({
  supplier,
  supplierOrder,
  orderQuantities,
  onOrderChange,
  getMaterialPriceForSupplier,
  getMaterialCapacity,
  isMaterialAvailable,
  disabled,
  gameState,
  supplierDeliveries,
}: SupplierOrderFormProps) {
  // Check if a material is available from this supplier
  const checkMaterialAvailability = (supplierId: number, materialType: string): boolean => {
    if (isMaterialAvailable) return isMaterialAvailable(supplierId, materialType)
    if (typeof supplier.capacityPerDay === "object") {
      return supplier.capacityPerDay[materialType] > 0
    }
    return true
  }

  // --- Calculate remaining capacity over the whole game, including staged orders ---
  const getRemainingCapacity = (materialType: string): number => {
    // Always use capacityPerGame from supplier config
    const lifetimeCapacity =
      (supplier.capacityPerGame && supplier.capacityPerGame[materialType]) ??
      0

    // Delivered so far (from gameState or supplierDeliveries)
    const deliveredSoFar =
      (supplierDeliveries?.[supplier.id]?.[materialType]) ||
      (gameState?.supplierDeliveries?.[supplier.id]?.[materialType]) ||
      0

    // Staged order for today (from supplierOrder)
    const stagedOrder = supplierOrder[`${materialType}Purchase`] || 0

    // Remaining = lifetime capacity - delivered - staged
    return Math.max(0, lifetimeCapacity - deliveredSoFar - stagedOrder)
  }

  // Get order quantities for a material (shipmentPrices or fallback)
  const getMaterialOrderQuantities = (materialType: string): number[] => {
    if (supplier.shipmentPrices && supplier.shipmentPrices[materialType]) {
      return [0, ...Object.keys(supplier.shipmentPrices[materialType]).map(Number).sort((a, b) => a - b)]
    }
    return orderQuantities
  }

  // Shipment cost for a material/quantity
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

  // Base cost for a material/quantity
  const getBaseCost = (materialType: string, quantity: number): number => {
    const pricePerUnit = getMaterialPriceForSupplier(supplier.id, materialType)
    return quantity * pricePerUnit
  }

  // Total cost for a material/quantity
  const getTotalCost = (materialType: string, quantity: number): number => {
    const baseCost = getBaseCost(materialType, quantity)
    const shipmentCost = getShipmentCost(materialType, quantity)
    if (
      supplier.shipmentPrices &&
      supplier.shipmentPrices[materialType] &&
      supplier.shipmentPrices[materialType][quantity]
    ) {
      return supplier.shipmentPricesIncludeBaseCost ? shipmentCost : baseCost + shipmentCost
    }
    return baseCost + shipmentCost
  }

  // Calculate total order cost for all materials
  const calculateSupplierOrderTotal = (): string => {
    let total = 0
    for (const { key } of MATERIALS) {
      const qty = supplierOrder[`${key}Purchase`] || 0
      total += getTotalCost(key, qty)
    }
    return total.toFixed(2)
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
      </div>

      {MATERIALS.map(({ key, label }) =>
        checkMaterialAvailability(supplier.id, key) ? (
          <div className="space-y-2" key={key}>
            <div className="flex justify-between items-center">
              <Label htmlFor={`${key}-${supplier.id}`}>
                {label} ({getMaterialPriceForSupplier(supplier.id, key).toFixed(2)} kr/unit)
              </Label>
              <span className="text-xs text-gray-500">{getRemainingCapacity(key)} units remaining</span>
            </div>
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
                    {getMaterialOrderQuantities(key)
                      .filter((qty) => qty > 0)
                      .map((qty) => {
                        const shipmentCost = getShipmentCost(key, qty)
                        const baseCost = getBaseCost(key, qty)
                        const totalCost = supplier.shipmentPricesIncludeBaseCost ? shipmentCost : baseCost + shipmentCost
                        return (
                          <tr key={qty} className={supplierOrder[`${key}Purchase`] === qty ? "bg-blue-50" : ""}>
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
                value={supplierOrder[`${key}Purchase`]?.toString() || "0"}
                onValueChange={(value) => onOrderChange(supplier.id, `${key}Purchase`, Number.parseInt(value))}
                className="flex space-x-2"
                disabled={disabled}
              >
                <div className="flex flex-wrap gap-2">
                  {getMaterialOrderQuantities(key).map((qty) => (
                    <div key={qty} className="flex items-center space-x-1">
                      <RadioGroupItem
                        value={qty.toString()}
                        id={`${key}-${supplier.id}-${qty}`}
                        disabled={qty > getRemainingCapacity(key) || disabled}
                      />
                      <Label htmlFor={`${key}-${supplier.id}-${qty}`}>{qty}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>
        ) : null
      )}

      <div className="text-right">
        Total for {supplier.name}: {calculateSupplierOrderTotal()} kr
      </div>
    </div>
  )
}
