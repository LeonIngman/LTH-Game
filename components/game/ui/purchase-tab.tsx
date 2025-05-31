"use client"

import { Info } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { LevelConfig, SupplierOrder } from "@/types/game"
import { SupplierOrderForm } from "./supplier-order-form"
import { useState, useEffect } from "react"
import { MATERIAL_BASE_PRICES } from "@/lib/game/constants"

interface PurchaseTabProps {
  levelConfig: LevelConfig
  levelId?: number
  supplierOrders: SupplierOrder[]
  activeSupplierTab?: string
  setActiveSupplierTab?: (tab: string) => void
  selectedDeliveryOption: number
  setSelectedDeliveryOption: (option: number) => void
  handleSupplierOrderChange: (supplierId: number, field: keyof SupplierOrder, value: number) => void
  isMaterialAvailable?: (supplierId: number, materialType: string) => boolean
  getMaterialPriceForSupplier?: (supplierId: number, materialType: string) => number
  getOrderQuantitiesForSupplier?: (supplierId: number) => number[]
  getMaterialCapacity?: (supplier: any, materialType: string) => number
  isDisabled: boolean
}

export function PurchaseTab({
  levelConfig,
  levelId = 0,
  supplierOrders,
  activeSupplierTab,
  setActiveSupplierTab,
  selectedDeliveryOption,
  setSelectedDeliveryOption,
  handleSupplierOrderChange,
  isMaterialAvailable,
  getMaterialPriceForSupplier,
  getOrderQuantitiesForSupplier,
  getMaterialCapacity,
  isDisabled,
}: PurchaseTabProps) {
  // Internal state for active tab
  const defaultTab = `supplier${levelConfig.suppliers[0]?.id || 1}`
  const [currentTab, setCurrentTab] = useState(defaultTab)

  // Use external state if provided, otherwise use internal state
  const activeTab = activeSupplierTab || currentTab

  // Update internal state when external state changes
  useEffect(() => {
    if (activeSupplierTab) {
      setCurrentTab(activeSupplierTab)
    }
  }, [activeSupplierTab])

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    if (setActiveSupplierTab) {
      setActiveSupplierTab(tabId)
    }
    setCurrentTab(tabId)
  }

  // Format capacity display for supplier
  const formatCapacityDisplay = (supplier: any) => {
    if (typeof supplier.capacityPerDay === "object") {
      return "Varies by item"
    } else {
      return `${supplier.capacityPerDay} units`
    }
  }

  // Default material price calculation if not provided
  const getDefaultMaterialPrice = (supplierId: number, materialType: string): number => {
    if (getMaterialPriceForSupplier) {
      return getMaterialPriceForSupplier(supplierId, materialType)
    }

    const supplier = levelConfig.suppliers.find((s) => s.id === supplierId)
    if (!supplier) return 0

    // If supplier has specific material prices, use those
    if (supplier.materialBasePrices && supplier.materialBasePrices[materialType]) {
      return supplier.materialBasePrices[materialType]
    }

    // Otherwise use the standard pricing model from constants
    return MATERIAL_BASE_PRICES[materialType] || 0
  }

  // Restore the original getOrderQuantities function but enhance it to use shipmentPrices
  const getOrderQuantities = (supplierId: number): number[] => {
    if (getOrderQuantitiesForSupplier) {
      return getOrderQuantitiesForSupplier(supplierId)
    }
    return getDefaultOrderQuantities(supplierId)
  }

  // Update the getDefaultOrderQuantities function to use shipmentPrices when available
  const getDefaultOrderQuantities = (supplierId: number): number[] => {
    const supplier = levelConfig.suppliers.find((s) => s.id === supplierId)
    if (!supplier) return [0, 5, 10, 15, 20]

    // If supplier has orderQuantities defined, use those
    if (supplier.orderQuantities && Array.isArray(supplier.orderQuantities)) {
      return [0, ...supplier.orderQuantities]
    }

    // Otherwise, generate default quantities based on capacity
    const capacity =
      typeof supplier.capacityPerDay === "object"
        ? Math.max(...Object.values(supplier.capacityPerDay))
        : supplier.capacityPerDay

    const step = Math.max(1, Math.floor(capacity / 5))
    return [0, step, step * 2, step * 3, step * 4, step * 5]
  }

  return (
    <>
      {/* Delivery Option Selection - only show for levels > 0 */}
      {levelConfig.deliveryOptions && levelConfig.deliveryOptions.length > 1 && levelId > 0 && (
        <div className="space-y-2 mb-4">
          <Label htmlFor="delivery">Select Delivery Method</Label>
          <Select
            value={selectedDeliveryOption.toString()}
            onValueChange={(value) => setSelectedDeliveryOption(Number(value))}
            disabled={isDisabled}
          >
            <SelectTrigger id="delivery">
              <SelectValue placeholder="Select delivery method" />
            </SelectTrigger>
            <SelectContent>
              {levelConfig.deliveryOptions.map((option) => (
                <SelectItem key={option.id} value={option.id.toString()}>
                  {option.name} ({option.leadTime} {option.leadTime === 1 ? "day" : "days"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">
            {levelConfig.deliveryOptions.find((d) => d.id === selectedDeliveryOption)?.description || ""}
          </div>
        </div>
      )}

      {/* For level 0, show a simple message about instant delivery */}
      {levelId === 0 && (
        <div className="p-3 bg-blue-50 rounded-md border border-blue-100 mb-4">
          <div className="flex items-start">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-blue-700">Instant Delivery</h4>
              <p className="text-xs text-blue-600">
                In this introductory level, all orders are delivered instantly with no waiting time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Tabs */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Order from Suppliers</h3>
        <p className="text-sm text-gray-600 mb-4">
          You can order from multiple suppliers each day. Each supplier has different prices and capacity limits. Order
          quantities vary by supplier.
        </p>

        {/* Custom implementation of Tabs that matches the visual style */}
        <div className="w-full">
          {/* Tab List - styled to match the main tabs */}
          <div className="flex w-full mb-4 bg-muted rounded-lg p-1">
            {levelConfig.suppliers.map((supplier) => (
              <button
                key={supplier.id}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all
                  ${
                    activeTab === `supplier${supplier.id}`
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                onClick={() => handleTabChange(`supplier${supplier.id}`)}
                type="button"
              >
                {supplier.name}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {levelConfig.suppliers.map((supplier) => (
            <div key={supplier.id} className={activeTab === `supplier${supplier.id}` ? "block" : "hidden"}>
              <SupplierOrderForm
                supplier={supplier}
                supplierOrder={
                  supplierOrders.find((o) => o.supplierId === supplier.id) || {
                    supplierId: supplier.id,
                    pattyPurchase: 0,
                    cheesePurchase: 0,
                    bunPurchase: 0,
                    potatoPurchase: 0,
                  }
                }
                orderQuantities={(supplierId, materialType) =>
                  materialType
                    ? getOrderQuantitiesForSupplier
                      ? getOrderQuantitiesForSupplier(supplierId, materialType)
                      : getOrderQuantities(supplierId)
                    : getOrderQuantities(supplierId)
                }
                onOrderChange={handleSupplierOrderChange}
                getMaterialPriceForSupplier={getDefaultMaterialPrice}
                getMaterialCapacity={getMaterialCapacity}
                isMaterialAvailable={isMaterialAvailable}
                disabled={isDisabled}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
