"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle } from "lucide-react"
import type { CostumerSalesPopupProps } from "@/types/components"
import { CustomerOrderForm } from "./ui/customer-order-form"

export function CustomerSalesPopup({
  isOpen,
  onClose,
  customer,
  customerOrders,
  handleCustomerOrderChange,
  isDisabled,
  gameState,
  day,
  levelConfig,
}: Readonly<CostumerSalesPopupProps>) {
  // Local state for pending order
  const [pendingQuantity, setPendingQuantity] = useState(0)
  const [hasConfirmedOrder, setHasConfirmedOrder] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Initialize pending quantity when customer changes
  useEffect(() => {
    if (customer) {
      const currentOrder = customerOrders.find((order) => order.customerId === customer.id)
      const currentQuantity = currentOrder?.quantity || 0
      setPendingQuantity(currentQuantity)
      setHasConfirmedOrder(currentQuantity > 0)
      setShowSuccessMessage(false)
    }
  }, [customer, customerOrders, isOpen])

  if (!customer || !isOpen) return null

  // Find the current confirmed order for this customer
  const currentOrder = customerOrders.find((order) => order.customerId === customer.id) || {
    customerId: customer.id,
    quantity: 0,
  }

  // Check if there are pending changes
  const hasPendingChanges = pendingQuantity !== currentOrder.quantity

  // Confirm the order
  const handleConfirmOrder = () => {
    handleCustomerOrderChange(customer.id, pendingQuantity)
    setHasConfirmedOrder(pendingQuantity > 0)
    setShowSuccessMessage(true)

    // Auto-close after showing success message
    setTimeout(() => {
      setShowSuccessMessage(false)
      onClose()
    }, 1500) // Show success message for 1.5 seconds before closing
  }

  // Calculate customer progress
  const totalDelivered = gameState.customerDeliveries[customer.id] || 0
  const customerProgress =
    customer.totalRequirement > 0 ? Math.min(100, Math.round((totalDelivered / customer.totalRequirement) * 100)) : 0

  // Get the total number of days in the schedule - safely handle empty schedule
  const totalDays =
    customer.deliverySchedule.length > 0 ? customer.deliverySchedule[customer.deliverySchedule.length - 1].day : 20

  // Simple check if schedule is being followed
  const getExpectedDelivery = () => {
    const passedMilestones = customer.deliverySchedule.filter((item) => item.day <= day)
    if (passedMilestones.length === 0) return 0

    const lastPassedMilestone = passedMilestones[passedMilestones.length - 1]
    const cumulativeAmount = customer.deliverySchedule
      .filter((item) => item.day <= lastPassedMilestone.day)
      .reduce((sum, curr) => sum + curr.requiredAmount, 0)

    return cumulativeAmount
  }

  const expectedDelivered = getExpectedDelivery()
  const scheduleFollowed = totalDelivered >= expectedDelivered

  // Calculate max sales
  const maxSales = gameState.inventory.finishedGoods || 0

  // Get the current game day directly from gameState as a fallback
  const currentGameDay = gameState.day

  // Format currency in Swedish format
  const formatCurrency = (amount: number): string => {
    return `${amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} kr`
  }

  // Filter out the end-of-game milestone
  const activeDeliverySchedule = customer.deliverySchedule.filter((item) => item.day < totalDays)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col space-y-2">
            <DialogTitle className="text-xl font-bold">Sales to {customer.name}</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Day {currentGameDay}</span>
              </Badge>
              {hasConfirmedOrder && !hasPendingChanges && currentOrder.quantity > 0 && (
                <Badge variant="default" className="bg-green-500 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Confirmed
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>


        <div className="space-y-4 py-4">
          <CustomerOrderForm
            customer={customer}
            totalDelivered={totalDelivered}
            customerProgress={customerProgress}
            scheduleFollowed={scheduleFollowed}
            activeDeliverySchedule={activeDeliverySchedule}
            currentGameDay={currentGameDay}
            formatCurrency={formatCurrency}
            pendingQuantity={pendingQuantity}
            setPendingQuantity={setPendingQuantity}
            setHasConfirmedOrder={setHasConfirmedOrder}
            isDisabled={isDisabled}
            maxSales={maxSales}
          />
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="py-4 px-6 bg-green-50 border border-green-200 rounded-md mx-6">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Order placed successfully!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              {pendingQuantity} meals ordered from {customer.name}.
            </p>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {/* Only show footer if not showing success message */}
          {!showSuccessMessage && (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                onClick={handleConfirmOrder}
                disabled={isDisabled || (!hasPendingChanges && hasConfirmedOrder)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {hasPendingChanges ? "Confirm Order" : "Order Confirmed"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
