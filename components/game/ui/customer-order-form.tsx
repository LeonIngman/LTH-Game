"use client"

import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Customer, CustomerOrderAction } from "@/types/game"

interface CustomerOrderFormProps {
  customer: Customer
  order: CustomerOrderAction
  customerProgress: number
  isDeliveryDueSoon: (customerId: number, day: number) => boolean
  isDeliveryOverdue: (customerId: number, day: number) => boolean
  onOrderChange: (customerId: number, quantity: number) => void
  disabled: boolean
  deliveredAmount: number
  finishedGoodsInventory: number
}

export function CustomerOrderForm({
  customer,
  order,
  customerProgress,
  isDeliveryDueSoon,
  isDeliveryOverdue,
  onOrderChange,
  disabled,
  deliveredAmount,
  finishedGoodsInventory,
}: CustomerOrderFormProps) {
  return (
    <div className="mb-4 p-4 border rounded-md">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium">{customer.name}</h4>
          <p className="text-sm text-gray-600">{customer.description}</p>
          {customer.randomLeadTime ? (
            <p className="text-xs text-gray-500 mt-1">
              Processing time: {customer.leadTimeRange?.join(", ")} days (varies due to operational uncertainty)
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Processing time: {customer.leadTime} {customer.leadTime === 1 ? "day" : "days"}
            </p>
          )}
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
          <span>{deliveredAmount} units</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Progress:</span>
          <span>{customerProgress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-blue-500" style={{ width: `${customerProgress}%` }} />
        </div>
      </div>

      <div className="mb-3">
        <h5 className="text-sm font-medium mb-1">Delivery Schedule:</h5>
        <div className="space-y-1">
          {customer.deliverySchedule.map((item, index) => (
            <div
              key={index}
              className={`text-xs p-1 rounded flex justify-between ${
                isDeliveryOverdue(customer.id, item.day)
                  ? "bg-red-50 text-red-700"
                  : isDeliveryDueSoon(customer.id, item.day)
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-gray-50"
              }`}
            >
              <span>Day {item.day}:</span>
              <span>{item.requiredAmount} units</span>
              {isDeliveryOverdue(customer.id, item.day) && <span className="text-red-600 font-medium">Overdue</span>}
              {isDeliveryDueSoon(customer.id, item.day) && !isDeliveryOverdue(customer.id, item.day) && (
                <span className="text-yellow-600 font-medium">Due Soon</span>
              )}
            </div>
          ))}
        </div>
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
                <tr key={qty} className={order.quantity === qty ? "bg-blue-50" : ""}>
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
            value={order.quantity.toString()}
            onValueChange={(value) => onOrderChange(customer.id, Number.parseInt(value))}
            className="flex space-x-2"
            disabled={finishedGoodsInventory <= 0 || disabled}
          >
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="0" id={`customer-${customer.id}-0`} disabled={disabled} />
                <Label htmlFor={`customer-${customer.id}-0`}>0</Label>
              </div>
              {customer.allowedShipmentSizes.map((qty) => (
                <div key={qty} className="flex items-center space-x-1">
                  <RadioGroupItem
                    value={qty.toString()}
                    id={`customer-${customer.id}-${qty}`}
                    disabled={qty > finishedGoodsInventory || disabled}
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
