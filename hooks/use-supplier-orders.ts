"use client"

import { useState, useEffect, useCallback } from "react"
import type { SupplierOrder, MaterialType } from "@/types/game"
import type { SupplierOrdersHook, SupplierOrdersParams } from "../types/hooks"

/**
 * Hook for managing supplier orders
 */
export function useSupplierOrders({ levelConfig, action, setAction }: SupplierOrdersParams): SupplierOrdersHook {
  // Initialize supplier orders with safety check for suppliers array
  const initializeSupplierOrders = useCallback((): SupplierOrder[] => {
    // Safety check: ensure suppliers array exists
    if (!levelConfig.suppliers || !Array.isArray(levelConfig.suppliers)) {
      console.warn("levelConfig.suppliers is undefined or not an array. Using empty array instead.")
      return []
    }

    return levelConfig.suppliers.map((supplier) => ({
      supplierId: supplier.id,
      pattyPurchase: 0,
      cheesePurchase: 0,
      bunPurchase: 0,
      potatoPurchase: 0,
    }))
  }, [levelConfig.suppliers])

  // State for supplier orders
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>(initializeSupplierOrders)

  // Update action when supplier orders change
  useEffect(() => {
    setAction((prev) => ({
      ...prev,
      supplierOrders,
    }))
  }, [supplierOrders, setAction])

  // Handle supplier order changes
  const handleSupplierOrderChange = useCallback(
    (supplierId: number, field: keyof SupplierOrder, value: number): void => {
      setSupplierOrders((prevOrders) =>
        prevOrders.map((order) => (order.supplierId === supplierId ? { ...order, [field]: value } : order)),
      )
    },
    [],
  )

  // Reset supplier orders
  const resetSupplierOrders = useCallback((): void => {
    setSupplierOrders(initializeSupplierOrders())
  }, [initializeSupplierOrders])

  // Check if material is available from a supplier
  const isMaterialAvailable = useCallback(
    (supplierId: number, materialType: MaterialType): boolean => {
      // Safety check: ensure suppliers array exists
      if (!levelConfig.suppliers || !Array.isArray(levelConfig.suppliers)) {
        return false
      }

      const supplier = levelConfig.suppliers.find((s) => s.id === supplierId)
      if (!supplier) return false

      if (typeof supplier.capacityPerGame === "object") {
        return supplier.capacityPerGame[materialType] > 0
      }

      return true
    },
    [levelConfig.suppliers],
  )

  // Get material-specific capacity for a supplier
  const getMaterialCapacity = useCallback(
    (supplierId: number, materialType: MaterialType): number => {
      // Safety check: ensure suppliers array exists
      if (!levelConfig.suppliers || !Array.isArray(levelConfig.suppliers)) {
        return 0
      }

      const supplier = levelConfig.suppliers.find((s) => s.id === supplierId)
      if (!supplier) return 0

      if (typeof supplier.capacityPerGame === "object") {
        return supplier.capacityPerGame[materialType] || 0
      } else {
        return supplier.capacityPerGame
      }
    },
    [levelConfig.suppliers],
  )

  // Calculate remaining capacity for a supplier
  const calculateRemainingCapacity = useCallback(
    (supplierId: number, materialType?: MaterialType): number => {
      const order = supplierOrders.find((o) => o.supplierId === supplierId)
      if (!order) return 0

      // Safety check: ensure suppliers array exists
      if (!levelConfig.suppliers || !Array.isArray(levelConfig.suppliers)) {
        return 0
      }

      const supplier = levelConfig.suppliers.find((s) => s.id === supplierId)
      if (!supplier) return 0

      // If supplier has per-material capacity
      if (typeof supplier.capacityPerGame === "object") {
        if (materialType) {
          // Return capacity for specific material
          const materialCapacity = supplier.capacityPerGame[materialType] || 0
          const materialOrdered = order[`${materialType}Purchase` as keyof typeof order] || 0
          return materialCapacity - materialOrdered
        } else {
          // Return total remaining capacity across all materials
          const totalOrdered = order.pattyPurchase + order.cheesePurchase + order.bunPurchase + order.potatoPurchase
          const totalCapacity =
            (supplier.capacityPerGame.patty || 0) +
            (supplier.capacityPerGame.cheese || 0) +
            (supplier.capacityPerGame.bun || 0) +
            (supplier.capacityPerGame.potato || 0)
          return totalCapacity - totalOrdered
        }
      } else {
        // Use the standard capacity model
        const totalOrdered = order.pattyPurchase + order.cheesePurchase + order.bunPurchase + order.potatoPurchase
        return supplier.capacityPerGame - totalOrdered
      }
    },
    [levelConfig.suppliers, supplierOrders],
  )

  // Add the function to the return object
  return {
    supplierOrders,
    setSupplierOrders,
    handleSupplierOrderChange,
    resetSupplierOrders,
    initializeSupplierOrders,
    isMaterialAvailable,
    getMaterialCapacity,
    calculateRemainingCapacity,
  }
}
