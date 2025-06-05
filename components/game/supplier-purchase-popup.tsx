"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import type { MaterialType, Supplier, SupplierOrder } from "@/types/game"
import type { SupplierPurchasePopupProps } from "@/types/components"
import { SupplierOrderForm } from "./ui/supplier-order-form"

const MATERIALS = ["patty", "cheese", "bun", "potato"] as const

export function SupplierPurchasePopup({
  isOpen,
  onClose,
  supplier,
  supplierOrders,
  handleSupplierOrderChange,
  isDisabled,
  getMaterialPriceForSupplier,
  getOrderQuantitiesForSupplier,
  gameState,
  levelConfig,
  setGameState,
  onOrderConfirmed,
}: SupplierPurchasePopupProps) {
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
      setHasConfirmedOrder(
        currentOrder.pattyPurchase > 0 ||
        currentOrder.cheesePurchase > 0 ||
        currentOrder.bunPurchase > 0 ||
        currentOrder.potatoPurchase > 0
      )
    }
  }, [supplier, supplierOrders])

  if (!supplier || !pendingOrder) return null

  // --- Capacity and Remaining Calculation ---
  // Use capacityPerGame for the supplier
  const getMaterialCapacity = (supplier: Supplier, material: string) => {
    return (supplier.capacityPerGame && supplier.capacityPerGame[material]) ?? 0
  }

  const getOrderedToday = (material: MaterialType) => {
    return supplierOrders
      .filter((order) => order.supplierId === supplier.id)
      .reduce((sum, order) => sum + (order[`${material}Purchase`] || 0), 0)
  }

  // Remaining = capacityPerGame - deliveredSoFar - stagedOrder
  const getRemainingCapacity = (material: MaterialType) => {
    const deliveredSoFar =
      (gameState?.supplierDeliveries?.[supplier.id]?.[material]) || 0
    const stagedOrder = getOrderedToday(material)
    const lifetimeCapacity = getMaterialCapacity(supplier, material)
    return Math.max(0, lifetimeCapacity - deliveredSoFar - stagedOrder)
  }

  // --- Order Change Handlers ---
  const handleLocalOrderChange = (supplierId: number, field: keyof SupplierOrder, value: number) => {
    setPendingOrder((prev) => (prev ? { ...prev, [field]: value } : null))
    setHasConfirmedOrder(false)
  }

  // --- Confirm Order ---
  const handleConfirmOrder = () => {
    if (pendingOrder && supplier) {
      // Only update the staged order for today
      for (const material of MATERIALS) {
        handleSupplierOrderChange(
          pendingOrder.supplierId,
          `${material}Purchase` as keyof SupplierOrder,
          pendingOrder[`${material}Purchase`] || 0
        )
      }
      setHasConfirmedOrder(true)
      if (onOrderConfirmed) onOrderConfirmed()
    }
  }

  // --- UI State ---
  const currentOrder = supplierOrders.find((order) => order.supplierId === supplier.id) || {
    supplierId: supplier.id,
    pattyPurchase: 0,
    cheesePurchase: 0,
    bunPurchase: 0,
    potatoPurchase: 0,
  }

  const hasPendingChanges =
    pendingOrder &&
    MATERIALS.some((mat) => pendingOrder[`${mat}Purchase`] !== currentOrder[`${mat}Purchase`])

  const hasAnyOrder =
    pendingOrder &&
    MATERIALS.some((mat) => pendingOrder[`${mat}Purchase`] > 0)

  // --- Delivery Option ---
  const totalLeadTime = supplier.leadTime || 0
  const isImmediateDelivery = totalLeadTime === 0

  // --- Render ---
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
            orderQuantities={getOrderQuantitiesForSupplier(supplier.id)}
            onOrderChange={handleLocalOrderChange}
            getMaterialPriceForSupplier={getMaterialPriceForSupplier}
            getMaterialCapacity={(_supplier, material) => getRemainingCapacity(material as MaterialType)}
            disabled={isDisabled}
            gameState={gameState}
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
