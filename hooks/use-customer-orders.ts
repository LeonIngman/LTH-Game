"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import type { CustomerOrder } from "@/types/game"
import type { CustomerOrdersHook, CustomerOrdersParams } from "../types/hooks"

/**
 * Hook for managing customer orders
 */
export function useCustomerOrders({
  gameState,
  levelConfig,
  action,
  setAction,
}: CustomerOrdersParams): CustomerOrdersHook {
  const { toast } = useToast()

  // Initialize customer orders
  const initializeCustomerOrders = useCallback((): CustomerOrder[] => {
    return (levelConfig.customers || []).map((customer) => ({
      customerId: customer.id,
      quantity: 0,
    }))
  }, [levelConfig.customers])

  // State for customer orders
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>(initializeCustomerOrders)

  // Update action when customer orders change
  useEffect(() => {
    setAction((prev) => ({
      ...prev,
      customerOrders,
    }))
  }, [customerOrders, setAction])

  // Calculate total customer order quantity
  const calculateTotalCustomerOrderQuantity = useCallback(
    (orders = customerOrders): number => {
      return orders.reduce((total, order) => total + order.quantity, 0)
    },
    [customerOrders],
  )

  // Calculate remaining inventory available for customer orders
  const getRemainingInventoryForCustomers = useCallback(
    (customerId?: number): number => {
      const totalOrderedByOthers = customerOrders.reduce((total, order) => {
        // Skip the current customer when calculating what others have ordered
        if (customerId !== undefined && order.customerId === customerId) {
          return total
        }
        return total + order.quantity
      }, 0)

      return Math.max(0, gameState.inventory.finishedGoods - totalOrderedByOthers)
    },
    [customerOrders, gameState.inventory.finishedGoods],
  )

  // Handle customer order changes
  const handleCustomerOrderChange = useCallback(
    (customerId: number, quantity: number): void => {
      // Calculate how many meals are already allocated to other customers
      const remainingInventory = getRemainingInventoryForCustomers(customerId)

      // Ensure the new quantity doesn't exceed available inventory
      const validQuantity = Math.min(quantity, remainingInventory)

      // If trying to order more than available, show a warning
      if (quantity > validQuantity) {
        toast({
          title: "Insufficient inventory",
          description: `You only have ${remainingInventory} meals available for this customer after fulfilling other orders.`,
          variant: "warning",
        })
      }

      setCustomerOrders((prevOrders) =>
        prevOrders.map((order) => (order.customerId === customerId ? { ...order, quantity: validQuantity } : order)),
      )
    },
    [getRemainingInventoryForCustomers, toast],
  )

  // Reset customer orders
  const resetCustomerOrders = useCallback((): void => {
    setCustomerOrders(initializeCustomerOrders())
  }, [initializeCustomerOrders])

  // Get customer progress percentage
  const getCustomerProgressPercentage = useCallback(
    (customerId: number): number => {
      const customer = levelConfig.customers?.find((c) => c.id === customerId)
      if (!customer) return 0

      const delivered = gameState.customerDeliveries[customerId] || 0
      return Math.min(100, Math.round((delivered / customer.totalRequirement) * 100))
    },
    [gameState.customerDeliveries, levelConfig.customers],
  )

  // Check if a customer delivery schedule item is due soon
  const isDeliveryDueSoon = useCallback(
    (customerId: number, day: number): boolean => {
      return gameState.day <= day && gameState.day >= day - 2
    },
    [gameState.day],
  )

  // Check if a customer delivery schedule item is overdue
  const isDeliveryOverdue = useCallback(
    (customerId: number, day: number): boolean => {
      return gameState.day > day
    },
    [gameState.day],
  )

  // Check if a customer order quantity is available based on current inventory and other orders
  const isCustomerOrderQuantityAvailable = useCallback(
    (customerId: number, quantity: number): boolean => {
      const remainingInventory = getRemainingInventoryForCustomers(customerId)
      return quantity <= remainingInventory
    },
    [getRemainingInventoryForCustomers],
  )

  return {
    customerOrders,
    setCustomerOrders,
    handleCustomerOrderChange,
    resetCustomerOrders,
    initializeCustomerOrders,
    calculateTotalCustomerOrderQuantity,
    getRemainingInventoryForCustomers,
    getCustomerProgressPercentage,
    isDeliveryDueSoon,
    isDeliveryOverdue,
    isCustomerOrderQuantityAvailable,
  }
}
