"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { CustomerOrderForm } from "./customer-order-form"
import { RestaurantSalesPopup } from "@/components/game/restaurant-sales-popup"
import type { Customer, CustomerOrderAction, GameState, LevelConfig } from "@/types/game"
import { AlertCircle } from "lucide-react"

interface SalesTabProps {
  levelConfig: LevelConfig
  customerOrders: CustomerOrderAction[]
  gameState: GameState
  isDisabled: boolean
  getCustomerProgressPercentage?: (customerId: number) => number
  isDeliveryDueSoon?: (customerId: number, day: number) => boolean
  isDeliveryOverdue?: (customerId: number, day: number) => boolean
  onCustomerOrderChange: (customerId: number, quantity: number) => void
  onSalesAttemptChange?: (quantity: number) => void
}

export function SalesTab({
  levelConfig,
  customerOrders,
  gameState,
  isDisabled,
  getCustomerProgressPercentage = () => 0,
  isDeliveryDueSoon = () => false,
  isDeliveryOverdue = () => false,
  onCustomerOrderChange,
  onSalesAttemptChange,
}: SalesTabProps) {
  const [salesQuantity, setSalesQuantity] = useState<number>(0)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const findCustomerOrder = (customerId: number) => {
    return (
      customerOrders.find((o) => o.customerId === customerId) || {
        customerId,
        quantity: 0,
      }
    )
  }

  const handleSalesQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value) || 0
    setSalesQuantity(value)
    if (onSalesAttemptChange) {
      onSalesAttemptChange(value)
    }
  }

  const handleOpenCustomerPopup = (customer: Customer) => {
    setSelectedCustomer(customer)
  }

  const handleCloseCustomerPopup = () => {
    setSelectedCustomer(null)
  }

  const estimatedRevenue = salesQuantity * (gameState.dailyDemand?.pricePerUnit || 0)

  // Make sure we're using the current day from the game state
  const currentDay = gameState.day || 1

  // Check if a customer is behind schedule
  const isCustomerBehindSchedule = (customer: Customer): boolean => {
    if (!customer) return false

    // Get the total delivered
    const totalDelivered = gameState.customerDeliveries[customer.id] || 0

    // Find the last milestone that has passed
    const passedMilestones = customer.deliverySchedule.filter((item) => item.day <= currentDay)
    if (passedMilestones.length === 0) return false

    // Get the last passed milestone
    const lastPassedMilestone = passedMilestones[passedMilestones.length - 1]

    // Calculate cumulative required amount up to this milestone
    const cumulativeRequired = customer.deliverySchedule
      .filter((item) => item.day <= lastPassedMilestone.day)
      .reduce((sum, item) => sum + item.requiredAmount, 0)

    // We're behind if we haven't delivered the required amount
    return totalDelivered < cumulativeRequired
  }

  // Check if a customer has a milestone due soon (within 2 days)
  const hasCustomerMilestoneDueSoon = (customer: Customer): boolean => {
    if (!customer) return false

    // Check if any milestone is due within the next 2 days
    return customer.deliverySchedule.some((milestone) => milestone.day > currentDay && milestone.day <= currentDay + 2)
  }

  return (
    <div className="space-y-4 pt-4 sales-tab">
      {/* Regular Sales Section */}
      <div className="mb-6 pb-4 border-b">
        <h3 className="text-lg font-semibold mb-2">Regular Sales</h3>
        <p className="text-sm text-gray-600 mb-4">
          Sell your finished meals directly to the market at the current market price.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="salesQuantity" className="text-sm font-medium">
                Quantity to sell
              </label>
              <Input
                id="salesQuantity"
                type="number"
                min="0"
                max={gameState.inventory.finishedGoods}
                value={salesQuantity}
                onChange={handleSalesQuantityChange}
                disabled={isDisabled}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Available: {gameState.inventory.finishedGoods} meals</p>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-2">
            <div className="text-sm">
              <span className="font-medium">Current market price:</span>{" "}
              {gameState.dailyDemand?.pricePerUnit.toFixed(2)} kr per meal
            </div>
            <div className="text-sm">
              <span className="font-medium">Estimated revenue:</span> {estimatedRevenue.toFixed(2)} kr
            </div>
          </div>
        </div>
      </div>

      {/* Customer Orders Section */}
      {levelConfig.customers && levelConfig.customers.length > 0 && (
        <div className="mt-6 pt-4 customers-section">
          <h3 className="text-lg font-semibold mb-2">Customer Orders</h3>
          <p className="text-sm text-gray-600 mb-4">
            Fulfill orders for specific customers. Each customer has their own requirements and pricing.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {levelConfig.customers.map((customer) => {
              const progress = getCustomerProgressPercentage(customer.id)
              const isBehind = isCustomerBehindSchedule(customer)
              const hasMilestoneSoon = hasCustomerMilestoneDueSoon(customer)

              return (
                <div
                  key={customer.id}
                  className={`border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isBehind
                      ? "border-orange-300 bg-orange-50"
                      : hasMilestoneSoon
                        ? "border-yellow-300 bg-yellow-50"
                        : "border-gray-200"
                  }`}
                  onClick={() => handleOpenCustomerPopup(customer)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{customer.name}</h3>
                    <div className="flex items-center">
                      {isBehind && (
                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Behind Schedule
                        </span>
                      )}
                      {!isBehind && hasMilestoneSoon && (
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                          Delivery Due Soon
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{customer.description}</p>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress:</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full">
                    <div
                      className={`h-full rounded-full ${isBehind ? "bg-orange-500" : "bg-blue-500"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detailed customer order forms */}
          {levelConfig.customers.map((customer) => (
            <CustomerOrderForm
              key={customer.id}
              customer={customer}
              order={findCustomerOrder(customer.id)}
              customerProgress={getCustomerProgressPercentage(customer.id)}
              isDeliveryDueSoon={isDeliveryDueSoon}
              isDeliveryOverdue={isDeliveryOverdue}
              onOrderChange={onCustomerOrderChange}
              disabled={isDisabled}
              deliveredAmount={gameState.customerDeliveries[customer.id] || 0}
              finishedGoodsInventory={gameState.inventory.finishedGoods}
            />
          ))}
        </div>
      )}

      {/* Restaurant Sales Popup */}
      {selectedCustomer && (
        <RestaurantSalesPopup
          isOpen={selectedCustomer !== null}
          onClose={handleCloseCustomerPopup}
          customer={selectedCustomer}
          customerOrders={customerOrders}
          handleCustomerOrderChange={onCustomerOrderChange}
          isDisabled={isDisabled}
          gameState={gameState}
          day={currentDay}
        />
      )}
    </div>
  )
}
