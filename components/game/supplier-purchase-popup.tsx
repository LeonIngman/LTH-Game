"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import type { Supplier, SupplierOrder, GameState, LevelConfig } from "@/types/game"
import { SupplierOrderForm } from "./ui/supplier-order-form"
import { calculateUnitCost, addImmediateInventory } from "@/lib/game/inventory-management"

interface SupplierPurchasePopupProps {
  isOpen: boolean
  onClose: () => void
  supplier: Supplier | null
  supplierOrders: SupplierOrder[]
  deliveryOptions: { id: number; name: string; costMultiplier: number; daysToDeliver: number }[]
  selectedDeliveryOption: number
  setSelectedDeliveryOption: (id: number) => void
  handleSupplierOrderChange: (supplierId: number, field: keyof SupplierOrder, value: number) => void
  isDisabled: boolean
  getMaterialPriceForSupplier: (supplierId: number, materialType: string) => number
  getOrderQuantitiesForSupplier: (supplierId: number) => number[]
  gameState?: GameState
  levelConfig?: LevelConfig
  setGameState?: (state: GameState) => void
}

export function SupplierPurchasePopup({
  isOpen,
  onClose,
  supplier,
  supplierOrders,
  deliveryOptions,
  selectedDeliveryOption,
  setSelectedDeliveryOption,
  handleSupplierOrderChange,
  isDisabled,
  getMaterialPriceForSupplier,
  getOrderQuantitiesForSupplier,
  gameState,
  levelConfig,
  setGameState,
}: SupplierPurchasePopupProps) {
  // Local state for pending orders
  const [pendingOrder, setPendingOrder] = useState<SupplierOrder | null>(null)
  const [hasConfirmedOrder, setHasConfirmedOrder] = useState(false)

  // Initialize pending order when supplier changes
  useEffect(() => {
    if (supplier) {
      const currentOrder = supplierOrders.find((order) => order.supplierId === supplier.id) || {
        supplierId: supplier.id,
        pattyPurchase: 0,
        cheesePurchase: 0,
        bunPurchase: 0,
        potatoPurchase: 0,
      }
      setPendingOrder(currentOrder)

      // Check if there's already a confirmed order for this supplier
      const hasExistingOrder =
        currentOrder.pattyPurchase > 0 ||
        currentOrder.cheesePurchase > 0 ||
        currentOrder.bunPurchase > 0 ||
        currentOrder.potatoPurchase > 0
      setHasConfirmedOrder(hasExistingOrder)
    }
  }, [supplier, supplierOrders])

  if (!supplier || !pendingOrder) return null

  // Handle local order changes
  const handleLocalOrderChange = (supplierId: number, field: keyof SupplierOrder, value: number) => {
    setPendingOrder((prev) => (prev ? { ...prev, [field]: value } : null))
    setHasConfirmedOrder(false) // Reset confirmation when changes are made
  }

  // Confirm the order
  const handleConfirmOrder = () => {
    if (pendingOrder && supplier && gameState && levelConfig && setGameState) {
      // Get delivery option to check lead time
      const deliveryOption = deliveryOptions.find((d) => d.id === selectedDeliveryOption)
      const deliveryLeadTime = deliveryOption?.daysToDeliver || 0
      const supplierLeadTime = supplier.leadTime || 0
      const totalLeadTime = deliveryLeadTime + supplierLeadTime
      const deliveryMultiplier = deliveryOption?.costMultiplier || 1.0

      // Create a copy of the game state to modify
      const newGameState = { ...gameState }

      // If lead time is 0, update inventory immediately
      if (totalLeadTime === 0) {
        const materials = [
          { type: "patty" as const, quantity: pendingOrder.pattyPurchase },
          { type: "cheese" as const, quantity: pendingOrder.cheesePurchase },
          { type: "bun" as const, quantity: pendingOrder.bunPurchase },
          { type: "potato" as const, quantity: pendingOrder.potatoPurchase },
        ]

        let totalCost = 0

        for (const material of materials) {
          if (material.quantity > 0) {
            // Calculate unit cost
            const unitCost = calculateUnitCost(
              material.quantity,
              material.type,
              supplier,
              levelConfig,
              deliveryMultiplier,
            )

            // Add to inventory immediately
            addImmediateInventory(
              newGameState,
              material.type,
              material.quantity,
              unitCost,
              supplier.id,
              selectedDeliveryOption,
            )

            totalCost += material.quantity * unitCost
          }
        }

        // Deduct cost from cash
        newGameState.cash = Number.parseFloat((newGameState.cash - totalCost).toFixed(2))

        // Update the game state
        setGameState(newGameState)
      }

      // Apply all changes to the main state (for pending orders or regular processing)
      handleSupplierOrderChange(pendingOrder.supplierId, "pattyPurchase", pendingOrder.pattyPurchase)
      handleSupplierOrderChange(pendingOrder.supplierId, "cheesePurchase", pendingOrder.cheesePurchase)
      handleSupplierOrderChange(pendingOrder.supplierId, "bunPurchase", pendingOrder.bunPurchase)
      handleSupplierOrderChange(pendingOrder.supplierId, "potatoPurchase", pendingOrder.potatoPurchase)

      setHasConfirmedOrder(true)
    } else {
      // Fallback to normal order processing if we don't have game state access
      handleSupplierOrderChange(pendingOrder.supplierId, "pattyPurchase", pendingOrder.pattyPurchase)
      handleSupplierOrderChange(pendingOrder.supplierId, "cheesePurchase", pendingOrder.cheesePurchase)
      handleSupplierOrderChange(pendingOrder.supplierId, "bunPurchase", pendingOrder.bunPurchase)
      handleSupplierOrderChange(pendingOrder.supplierId, "potatoPurchase", pendingOrder.potatoPurchase)

      setHasConfirmedOrder(true)
    }
  }

  // Check if there are any pending changes
  const currentOrder = supplierOrders.find((order) => order.supplierId === supplier.id) || {
    supplierId: supplier.id,
    pattyPurchase: 0,
    cheesePurchase: 0,
    bunPurchase: 0,
    potatoPurchase: 0,
  }

  const hasPendingChanges =
    pendingOrder &&
    (pendingOrder.pattyPurchase !== currentOrder.pattyPurchase ||
      pendingOrder.cheesePurchase !== currentOrder.cheesePurchase ||
      pendingOrder.bunPurchase !== currentOrder.bunPurchase ||
      pendingOrder.potatoPurchase !== currentOrder.potatoPurchase)

  const hasAnyOrder =
    pendingOrder &&
    (pendingOrder.pattyPurchase > 0 ||
      pendingOrder.cheesePurchase > 0 ||
      pendingOrder.bunPurchase > 0 ||
      pendingOrder.potatoPurchase > 0)

  // Get order quantities for this supplier
  const orderQuantities = getOrderQuantitiesForSupplier(supplier.id)

  // Check if this is immediate delivery
  const deliveryOption = deliveryOptions.find((d) => d.id === selectedDeliveryOption)
  const totalLeadTime = (deliveryOption?.daysToDeliver || 0) + (supplier.leadTime || 0)
  const isImmediateDelivery = totalLeadTime === 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>Order from {supplier.name}</span>
            <div className="flex items-center gap-2">
              {isImmediateDelivery && (
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  Instant Delivery
                </Badge>
              )}
              {hasConfirmedOrder && !hasPendingChanges && (
                <Badge variant="default" className="bg-green-500 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Confirmed
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <SupplierOrderForm
            supplier={supplier}
            supplierOrder={pendingOrder}
            orderQuantities={orderQuantities}
            onOrderChange={handleLocalOrderChange}
            getMaterialPriceForSupplier={getMaterialPriceForSupplier}
            disabled={isDisabled}
          />
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {hasAnyOrder && (
            <Button
              onClick={handleConfirmOrder}
              disabled={isDisabled || (!hasPendingChanges && hasConfirmedOrder)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {hasPendingChanges
                ? isImmediateDelivery
                  ? "Confirm & Deliver Now"
                  : "Confirm Order"
                : "Order Confirmed"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
