"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/i18n"
import type { SupplyChainMapProps } from "@/types/components"
import { MapPositions } from "@/types/game"

// Colors for suppliers and restaurants
const supplierColors = {
  1: "#E75A7C", // Pink Patty - pink color
  2: "#8B4513", // Brown Sauce - brown color
  3: "#FF0000", // Firehouse Foods - bright red
  finishedGoods: "#1E40AF", // Restaurants - deeper blue
}

// Default milestone days
const defaultMilestoneDays = [6, 12, 18, 24, 30]

export function SupplyChainMap({
  pendingOrders = [],
  pendingCustomerOrders = [],
  onClose,
  gameState,
  suppliers = [],
  customers = [],
  levelConfig,
  onSupplierClick,
  onFactoryClick,
  onCustomerClick,
  level = 0, // Default to level 0
}: SupplyChainMapProps) {
  const { translations } = useTranslation()
  const [activeSuppliers, setActiveSuppliers] = useState<Record<number, boolean>>({
    1: false, // Pink Pantry
    2: false, // Brown Sauce
    3: false, // Firehouse Foods
  })

  const [activeCustomerOrders, setActiveCustomerOrders] = useState<Record<number, boolean>>({
    1: false, // Yummy zone
    2: false, // Toast-to-go
    3: false, // StudyFuel
  })

  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [mapRef, setMapRef] = useState<HTMLDivElement | null>(null)

  // Get map positions from level config if available
  const getPositions = (): MapPositions => {
    if (levelConfig?.mapPositions) {
      // Try to get positions for the specific level
      if (levelConfig.mapPositions) {
        return levelConfig.mapPositions
      }
    }

    // Default positions for other levels
    return {
      mainFactory: { x: 515, y: 432 },
      suppliers: [
        { x: 150, y: 250, name: "Pink Patty", id: 1 },
        { x: 350, y: 430, name: "Brown Sauce", id: 2 },
        { x: 150, y: 650, name: "Firehouse Foods", id: 3 },
      ],
      customers: [
        { x: 850, y: 150, name: "Yummy Zone", id: 1 },
        { x: 850, y: 430, name: "Toast-to-go", id: 2 },
        { x: 850, y: 650, name: "StudyFuel", id: 3 },
      ],
    }
  }

  const positions = getPositions()

  // Get map image path based on level
  const getMapImagePath = (level: number) => {
    if (level === 0) {
      return `/images/Level0.png`
    } else if (level === 1 || level === 2 || level === 3) {
      return `/images/Level1-2.png`
    }

    // For levels 4 and above, fallback to SVG maps
    return `/images/L${level}map.svg` // Fallback to SVG maps for other levels
  }

  // Update active suppliers based on pending orders
  useEffect(() => {
    const newActiveSuppliers = { ...activeSuppliers }

    // Reset all to false first
    Object.keys(newActiveSuppliers).forEach((key) => {
      newActiveSuppliers[Number(key)] = false
    })

    // Set active based on pending orders, grouped by supplier ID
    pendingOrders.forEach((order) => {
      if (order.supplierId) {
        newActiveSuppliers[order.supplierId] = true
      }
    })

    setActiveSuppliers(newActiveSuppliers)
  }, [pendingOrders])

  // Update active customer orders
  useEffect(() => {
    // Simple logic: activate restaurants based on number of pending customer orders
    const newActiveCustomerOrders = [false, false, false]

    for (let i = 0; i < Math.min(pendingCustomerOrders?.length || 0, 3); i++) {
      newActiveCustomerOrders[i] = true
    }

    setActiveCustomerOrders(newActiveCustomerOrders)
  }, [pendingCustomerOrders])

  // Function to create a path between two points with a curve
  const createCurvedPath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    // Calculate control point for the curve (slightly offset from midpoint)
    const midX = (start.x + end.x) / 2
    const midY = (start.y + end.y) / 2
    const offset = 30 // Offset for the control point

    // Use a fixed seed for randomOffset to ensure consistency
    const randomOffset = (start.x * 7 + end.y * 13) % 100 > 50 ? offset : -offset

    // Create the curved path
    return `M${start.x},${start.y} Q${midX},${midY + randomOffset} ${end.x},${end.y}`
  }

  // Generate a unique ID for each path to reference in animations
  const getPathId = (from: string, to: string, index: number) => `path-${from}-${to}-${index}`

  // Handle supplier click
  const handleSupplierClick = (supplierId: number) => {
    if (onSupplierClick) {
      onSupplierClick(supplierId)
    }
  }

  // Handle factory click
  const handleFactoryClick = () => {
    if (onFactoryClick) {
      onFactoryClick()
    }
  }

  // Handle restaurant click
  const handleCustomerClick = (customerId: number) => {
    if (onCustomerClick) {
      onCustomerClick(customerId)
    }
  }

  // Function to check if a restaurant has missed milestones
  const hasMissedMilestone = (customerId: number): boolean => {
    // Safety checks
    if (!gameState) {
      return false
    }

    const currentDay = gameState.day
    const totalDelivered = gameState.customerDeliveries[customerId] || 0

    // Try to find the customer in the customers array
    let deliverySchedule = null
    let customerName = `Customer ${customerId}`

    // First try to find the customer in the provided customers array
    if (customers && customers.length > 0) {
      const customer = customers.find((c) => c.id === customerId)
      if (customer) {
        deliverySchedule = customer.deliverySchedule
        customerName = customer.name
      }
    }

    // If not found in customers array, try to find in level config
    if ((!deliverySchedule || deliverySchedule.length === 0) && levelConfig && levelConfig.customers) {
      const customer = levelConfig.customers.find((c) => c.id === customerId)
      if (customer) {
        deliverySchedule = customer.deliverySchedule
        customerName = customer.name
      }
    }

    // If still not found, return false
    if (!deliverySchedule) return false


    // Find all milestones that have passed
    const passedMilestones = deliverySchedule.filter((item) => item.day <= currentDay)
    if (passedMilestones.length === 0) {
      return false
    }

    // Calculate cumulative required amount up to the current day
    const cumulativeAmount = passedMilestones.reduce((sum, curr) => sum + curr.requiredAmount, 0)

    // Check if we've delivered enough
    const scheduleFollowed = totalDelivered >= cumulativeAmount
    const missed = !scheduleFollowed

    return missed
  }

  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden" data-tutorial="supply-chain-map">
      <div ref={setMapRef} className="relative w-full h-full">
        {/* Map image with level-specific SVG */}
        <div className="w-full h-full relative">
          <img
            src={getMapImagePath(level) || "/placeholder.svg"}
            alt={`Supply Chain Map - Level ${level}`}
            className="w-full h-full object-contain"
            onLoad={() => {
              setImageLoaded(true)
              setImageError(false)
            }}
            onError={() => {
              console.error(`Failed toload supply chain map image from ${getMapImagePath(level)}`)
              setImageError(true)
            }}
            style={{ display: imageError ? "none" : "block" }}
          />

          {/* Fallback for image loading error */}
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-sky-100">
              <div className="text-center p-4">
                <p className="text-red-500 font-medium mb-2">Failed to load map image</p>
                <p className="text-sm text-gray-600 mb-4">Using fallback map background</p>

                {/* Simple fallback map visualization */}
                <div className="w-full max-w-lg h-96 bg-sky-200 rounded-lg relative mx-auto">
                  {/* Stylized land mass */}
                  <div className="absolute inset-[10%] bg-green-500 rounded-3xl"></div>

                  {/* Supplier indicators */}
                  {positions.suppliers.map((supplier) => {
                    const normalizedX = (supplier.x / 1000) * 100
                    const normalizedY = (supplier.y / 800) * 100
                    return (
                      <div
                        key={`fallback-supplier-${supplier.id}`}
                        className="absolute w-8 h-8 bg-yellow-500 rounded-md border-2 border-gray-700"
                        style={{
                          left: `calc(${normalizedX}% - 16px)`,
                          top: `calc(${normalizedY}% - 16px)`,
                        }}
                      ></div>
                    )
                  })}

                  {/* Restaurant indicators */}
                  {positions.customers.map((customer) => {
                    const normalizedX = (customer.x / 1000) * 100
                    const normalizedY = (customer.y / 800) * 100
                    return (
                      <div
                        key={`fallback-restaurant-${customer.id}`}
                        className="absolute w-8 h-8 bg-red-500 rounded-md border-2 border-gray-700"
                        style={{
                          left: `calc(${normalizedX}% - 16px)`,
                          top: `calc(${normalizedY}% - 16px)`,
                        }}
                      ></div>
                    )
                  })}

                  {/* Main factory */}
                  <div
                    className="absolute w-10 h-10 bg-purple-700 rounded-full border-2 border-purple-900"
                    style={{
                      left: `calc(${(positions.mainFactory.x / 1000) * 100}% - 20px)`,
                      top: `calc(${(positions.mainFactory.y / 800) * 100}% - 20px)`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SVG overlay for animated paths */}
        <svg
          className="absolute top-0 left-0 w-full h-full"
          viewBox="0 0 1000 800"
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: "visible" }}
        >
          {/* Define all paths first so they can be referenced */}
          <defs>
            {/* Supplier paths */}
            {positions.suppliers.map((supplier) => (
              <path
                key={`path-def-supplier-${supplier.id}`}
                id={getPathId(`supplier-${supplier.id}`, "factory", 0)}
                d={createCurvedPath(supplier, positions.mainFactory)}
                fill="none"
              />
            ))}

            {/* Restaurant paths */}
            {positions.customers.map((customer) => (
              <path
                key={`path-def-restaurant-${customer.id}`}
                id={getPathId("factory", `restaurant-${customer.id}`, 0)}
                d={createCurvedPath(positions.mainFactory, customer)}
                fill="none"
              />
            ))}
          </defs>

          {/* Main factory indicator - Now clickable */}
          <g onClick={handleFactoryClick} style={{ cursor: "pointer" }} className="hover:opacity-80 transition-opacity">
            <circle
              cx={positions.mainFactory.x}
              cy={positions.mainFactory.y}
              r="15"
              fill="#5B21B6"
              stroke="#4C1D95"
              strokeWidth="2"
            />
            <text
              x={positions.mainFactory.x}
              y={positions.mainFactory.y + 30}
              textAnchor="middle"
              fill="#4C1D95"
              fontSize="14"
              fontWeight="bold"
              pointerEvents="none"
            >
              Main Factory
            </text>
          </g>

          {/* Supplier indicators - Now clickable */}
          {positions.suppliers.map((supplier) => {
            const supplierId = Number(supplier.id)
            const supplierColor = supplierColors[supplierId as keyof typeof supplierColors] || "#999"

            return (
              <g
                key={`supplier-${supplier.id}`}
                onClick={() => handleSupplierClick(supplierId)}
                style={{ cursor: "pointer" }}
                className="hover:opacity-80 transition-opacity"
              >
                <circle cx={supplier.x} cy={supplier.y} r="15" fill={supplierColor} stroke="#666" strokeWidth="2" />
                <text
                  x={supplier.x}
                  y={supplier.y + 30}
                  textAnchor="middle"
                  fill={supplierColor}
                  fontSize="14"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {supplier.name}
                </text>
              </g>
            )
          })}

          {/* Restaurant indicators - Now clickable */}
          {positions.customers.map((customer) => {
            const customerId = Number(customer.id)
            const missed = customerId ? hasMissedMilestone(customerId) : false

            return (
              <g
                key={`restaurant-${customer.id}`}
                onClick={() => handleCustomerClick(customerId)}
                style={{ cursor: "pointer" }}
                className="hover:opacity-80 transition-opacity"
              >
                {/* Restaurant circle */}
                <circle
                  cx={customer.x}
                  cy={customer.y}
                  r="15"
                  fill={supplierColors.finishedGoods}
                  stroke={missed ? "#EF4444" : "#1E3A8A"}
                  strokeWidth={missed ? "3" : "2"}
                />

                {/* Restaurant name */}
                <text
                  x={customer.x}
                  y={customer.y + 30}
                  textAnchor="middle"
                  fill={supplierColors.finishedGoods}
                  fontSize="14"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {customer.name}
                </text>
              </g>
            )
          })}

          {/* Supplier to Main Factory Paths */}
          {Object.entries(activeSuppliers).map(([supplierId, isActive]) => {
            const id = Number(supplierId)
            if (!isActive || !positions.suppliers[id]) return null

            const pathId = getPathId(`supplier-${id}`, "factory", 0)
            const fillColor = supplierColors[id as keyof typeof supplierColors] || "#999"

            return (
              <g key={`supplier-path-${id}`} pointerEvents="none">
                {/* Dotted path line */}
                <use
                  href={`#${pathId}`}
                  fill="none"
                  stroke={fillColor}
                  strokeWidth="3"
                  strokeDasharray="10,10"
                  opacity="0.7"
                />

                {/* Animated dots along the path */}
                {[0, 1, 2].map((i) => (
                  <circle key={`supplier-dot-${id}-${i}`} r="8" fill={fillColor}>
                    <animateMotion dur="3s" begin={`${i}s`} repeatCount="indefinite" rotate="auto">
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
                  </circle>
                ))}
              </g>
            )
          })}

          {/* Main Factory to Restaurant Paths */}
          {Object.entries(activeCustomerOrders).map(([customerId, isActive]) => {
            const id = Number(customerId)
            if (!isActive || !positions.customers[id]) return null

            const pathId = getPathId("factory", `restaurant-${id}`, 0)
            const fillColor = supplierColors.finishedGoods || "#3B82F6"

            return (
              <g key={`restaurant-path-${id}`} pointerEvents="none">
                {/* Dotted path line */}
                <use
                  href={`#${pathId}`}
                  fill="none"
                  stroke={fillColor}
                  strokeWidth="3"
                  strokeDasharray="10,10"
                  opacity="0.7"
                />

                {/* Animated dots along the path */}
                {[0, 1, 2].map((i) => (
                  <circle key={`restaurant-dot-${id}-${i}`} r="8" fill={fillColor}>
                    <animateMotion dur="3s" begin={`${i}s`} repeatCount="indefinite" rotate="auto">
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
                  </circle>
                ))}
              </g>
            )
          })}
        </svg>

        {/* Legend - Moved to bottom-right */}
        <div className="absolute bottom-4 right-4 bg-white/80 p-3 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold mb-2">{translations.game.supplyChainLegend}</h3>
          <div className="grid grid-cols-1 gap-y-1 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#E75A7C] mr-2 border border-gray-300"></div>
              <span>Pink Patty</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#8B4513] mr-2 border border-gray-300"></div>
              <span>Brown Sauce</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#FF0000] mr-2 border border-gray-300"></div>
              <span>Firehouse Foods</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#1E40AF] mr-2 border border-gray-300"></div>
              <span>Restaurants</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
