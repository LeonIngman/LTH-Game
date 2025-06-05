"use client"

import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { CustomerOrderFormProps } from "@/types/components"
import { AlertTriangle, CheckCircle2 } from "lucide-react"

export function CustomerOrderForm({
  customer,
  totalDelivered,
  customerProgress,
  scheduleFollowed,
  activeDeliverySchedule,
  currentGameDay,
  formatCurrency,
  pendingQuantity,
  setPendingQuantity,
  setHasConfirmedOrder,
  isDisabled,
  maxSales,
}: CustomerOrderFormProps) {
  return (
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
        <div className="flex justify-between text-sm">
          <span>Lead time:</span>
          <span>{customer.leadTime} {customer.leadTime === 1 ? "day" : "days"}</span>
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
  )
}
