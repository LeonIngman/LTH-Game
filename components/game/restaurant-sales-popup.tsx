"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertTriangle, Calendar, CheckCircle2, CheckCircle } from "lucide-react"
import type { Customer, CustomerOrderAction, GameState, LevelConfig } from "@/types/game"

interface RestaurantSalesPopupProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer | null
  customerOrders: CustomerOrderAction[]
  handleCustomerOrderChange: (customerId: number, quantity: number) => void
  isDisabled: boolean
  gameState: GameState
  day: number
  levelConfig?: LevelConfig
}

export function RestaurantSalesPopup({
  isOpen,
  onClose,
  customer,
  customerOrders,
  handleCustomerOrderChange,
  isDisabled,
  gameState,
  day,
  levelConfig,
}: RestaurantSalesPopupProps) {
  // Local state for pending order
  const [pendingQuantity, setPendingQuantity] = useState(0)
  const [hasConfirmedOrder, setHasConfirmedOrder] = useState(false)

  // Initialize pending quantity when customer changes
  useEffect(() => {
    if (customer) {
      const currentOrder = customerOrders.find((order) => order.customerId === customer.id)
      const currentQuantity = currentOrder?.quantity || 0
      setPendingQuantity(currentQuantity)
      setHasConfirmedOrder(currentQuantity > 0)
    }
  }, [customer, customerOrders])

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
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <span>Sales to {customer.name}</span>
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
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="mb-4 p-4 border rounded-md">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium">{customer.name}</h4>
                <p className="text-sm text-gray-600">{customer.description}</p>
              </div>
              <Badge className="bg-blue-500">{customer.pricePerUnit} kr/unit</Badge>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm">
                <span>Total Requirement:</span>
                <span>{customer.totalRequirement} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivered:</span>
                <span>{totalDelivered} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Remaining:</span>
                <span>{Math.max(0, customer.totalRequirement - totalDelivered)} units</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${scheduleFollowed ? "bg-blue-500" : "bg-orange-500"}`}
                  style={{ width: `${customerProgress}%` }}
                />
              </div>
            </div>

            {/* Simplified Schedule Status */}
            {!scheduleFollowed && (
              <div className="mb-3">
                <div className="p-2 rounded-md bg-orange-50 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <div>
                    <h5 className="text-sm font-medium text-orange-700">Behind Schedule</h5>
                    <p className="text-xs text-orange-600">
                      Missing deadlines incurs a penalty of 40% of the order value
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-3">
              <h5 className="text-sm font-medium mb-1">Milestones:</h5>
              {activeDeliverySchedule.length > 0 ? (
                <div className="space-y-1">
                  {activeDeliverySchedule.map((item, index) => {
                    const cumulativeAmount = customer.deliverySchedule
                      .filter((_, i) => i <= index)
                      .reduce((sum, curr) => sum + curr.requiredAmount, 0)

                    const remainingAmount = Math.max(0, cumulativeAmount - totalDelivered)
                    const isPastDeadline = item.day <= currentGameDay
                    const isCompleted = totalDelivered >= cumulativeAmount
                    const isMissed = isPastDeadline && totalDelivered < cumulativeAmount

                    const missedUnits = isMissed ? cumulativeAmount - totalDelivered : 0
                    const penaltyAmount = missedUnits * customer.pricePerUnit * 0.4

                    const bgClass = isCompleted
                      ? "bg-green-50 text-green-700"
                      : isMissed
                        ? "bg-orange-50 text-orange-700"
                        : "bg-gray-50 text-gray-700"

                    return (
                      <div key={index} className={`text-xs p-2 rounded flex flex-col ${bgClass}`}>
                        <div className="flex justify-between">
                          <span className="font-medium">Day {item.day}</span>
                          {isCompleted && (
                            <span className="text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Completed
                            </span>
                          )}
                          {isMissed && (
                            <span className="text-orange-600 font-medium">
                              Missed - Penalty: {formatCurrency(penaltyAmount)}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>
                            Required: {cumulativeAmount} units (
                            {Math.round((cumulativeAmount / customer.totalRequirement) * 100)}%)
                          </span>
                          <span>Remaining: {remainingAmount} units</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No specific milestones before the end of the game.</p>
              )}
            </div>

            {/* Transport costs table */}
            <div className="mb-3">
              <h5 className="text-sm font-medium mb-1">Transport Costs:</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-1 border">Quantity</th>
                      <th className="p-1 border">Transport Cost (kr)</th>
                      <th className="p-1 border">Revenue (kr)</th>
                      <th className="p-1 border">Net Revenue (kr)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.allowedShipmentSizes.map((qty) => (
                      <tr key={qty} className={pendingQuantity === qty ? "bg-blue-50" : ""}>
                        <td className="p-1 border text-center">{qty}</td>
                        <td className="p-1 border text-center">{customer.transportCosts[qty]}</td>
                        <td className="p-1 border text-center">{(qty * customer.pricePerUnit).toFixed(2)}</td>
                        <td className="p-1 border text-center">
                          {(qty * customer.pricePerUnit - customer.transportCosts[qty]).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`customer-${customer.id}`}>Order Quantity</Label>
              <div className="flex flex-col space-y-2">
                <RadioGroup
                  value={pendingQuantity.toString()}
                  onValueChange={(value) => {
                    setPendingQuantity(Number.parseInt(value))
                    setHasConfirmedOrder(false)
                  }}
                  className="flex space-x-2"
                  disabled={maxSales <= 0 || isDisabled}
                >
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="0" id={`customer-${customer.id}-0`} disabled={isDisabled} />
                      <Label htmlFor={`customer-${customer.id}-0`}>0</Label>
                    </div>
                    {customer.allowedShipmentSizes.map((qty) => (
                      <div key={qty} className="flex items-center space-x-1">
                        <RadioGroupItem
                          value={qty.toString()}
                          id={`customer-${customer.id}-${qty}`}
                          disabled={qty > maxSales || isDisabled}
                        />
                        <Label htmlFor={`customer-${customer.id}-${qty}`}>{qty}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
