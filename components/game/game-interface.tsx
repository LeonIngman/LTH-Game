"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { GameAction, Supplier, Customer, LevelConfig } from "@/types/game"
import { level0Config } from "@/lib/game/level0"
import { level1Config } from "@/lib/game/level1"
import { level2Config } from "@/lib/game/level2"
import { level3Config } from "@/lib/game/level3"
import { DEFAULT_DELIVERY_OPTION_ID } from "@/lib/constants"
import { useAuth } from "@/lib/auth-context"
import { calculateDailyInventoryValuation, calculateInventoryHoldingCosts } from "@/lib/game/inventory-management"

// Import our UI components
import { GameHeader } from "./ui/game-header"
import { StatusBar } from "./ui/status-bar"
import { MarketInfo } from "./ui/market-info"
import { GameHistory } from "./ui/game-history"
import { CostSummary } from "./ui/cost-summary"
import { GameDialogs } from "./ui/game-dialogs"
import { InventoryChart } from "./inventory-chart"
import { CashflowChart } from "./cashflow-chart"
import { SupplyChainMap } from "./supply-chain-map"
import { SupplierPurchasePopup } from "./supplier-purchase-popup"
import { ProductionPopup } from "./production-popup"
import { RestaurantSalesPopup } from "./restaurant-sales-popup"
import { ObjectivesDialog } from "./objectives-dialog"
import { GameOverDialog } from "./game-over-dialog"
import { ForecastingDialog } from "./forecasting-dialog"
import { DailyOrderSummary } from "./ui/daily-order-summary"
import { DebugPriceInfo } from "./ui/debug-price-info"
import { QuickActionsWidget } from "./ui/quick-actions-widget"

// Import our custom hooks
import { useGameState } from "@/hooks/use-game-state"
import { useGameActions } from "@/hooks/use-game-actions"
import { useGameCalculations } from "@/hooks/use-game-calculations"
import { useSupplierOrders } from "@/hooks/use-supplier-orders"
import { useCustomerOrders } from "@/hooks/use-customer-orders"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

interface GameInterfaceProps {
  levelId: number | string
}

export function GameInterface({ levelId }: GameInterfaceProps) {
  const { toast } = useToast()
  const { user } = useAuth()

  // Get level configuration based on levelId
  const levelConfig = useMemo<LevelConfig>(() => {
    const numericLevelId = typeof levelId === "string" ? Number.parseInt(levelId, 10) : levelId

    switch (numericLevelId) {
      case 0:
        return level0Config
      case 1:
        return level1Config
      case 2:
        return level2Config
      case 3:
        return level3Config
      default:
        return level0Config
    }
  }, [levelId])

  // Ensure levelConfig has required properties
  useEffect(() => {
    if (!levelConfig.demandModel) {
      // Use default demand model if not defined
      levelConfig.demandModel = (day) => ({ quantity: 10, pricePerUnit: 30 })
    }

    // Ensure suppliers array exists
    if (!levelConfig.suppliers) {
      levelConfig.suppliers = []
    }

    // Ensure customers array exists
    if (!levelConfig.customers) {
      levelConfig.customers = []
    }
  }, [levelConfig])

  // State management
  const [showForecasting, setShowForecasting] = useState<boolean>(false)
  const [forecastingCompleted, setForecastingCompleted] = useState<boolean>(false)
  const [showTutorial, setShowTutorial] = useState<boolean>(false)
  const [showMap, setShowMap] = useState<boolean>(false)
  const [showChart, setShowChart] = useState<boolean>(false)
  const [showObjectives, setShowObjectives] = useState<boolean>(false)
  const [showGameOver, setShowGameOver] = useState<boolean>(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [showSupplierPopup, setShowSupplierPopup] = useState<boolean>(false)
  const [showProductionPopup, setShowProductionPopup] = useState<boolean>(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Customer | null>(null)
  const [showRestaurantPopup, setShowRestaurantPopup] = useState<boolean>(false)

  // Delivery option state
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<number>(() => {
    if (levelConfig.deliveryOptions && levelConfig.deliveryOptions.length > 0) {
      if (levelConfig.id === 0 && levelConfig.deliveryOptions.length > 0) {
        return levelConfig.deliveryOptions[0].id
      }
      return levelConfig.deliveryOptions.length > 1
        ? levelConfig.deliveryOptions[1]?.id || levelConfig.deliveryOptions[0].id
        : levelConfig.deliveryOptions[0].id
    }
    return DEFAULT_DELIVERY_OPTION_ID
  })

  // Initialize game state and action
  const { gameState, setGameState, isLastDay } = useGameState(levelConfig)
  const [action, setAction] = useState<GameAction>({
    supplierOrders: [],
    production: 0,
    salesAttempt: 0,
    deliveryOptionId: selectedDeliveryOption,
    customerOrders: [],
  })

  // Check if forecasting is required
  const requiresForecasting = levelConfig.id === 2 || levelConfig.id === 3

  // Show forecasting dialog for levels 2 and 3
  useEffect(() => {
    if (requiresForecasting && !forecastingCompleted && gameState.day === 1) {
      setShowForecasting(true)
    }
  }, [requiresForecasting, forecastingCompleted, gameState.day])

  // Update action when delivery option changes
  useEffect(() => {
    setAction((prev) => ({
      ...prev,
      deliveryOptionId: selectedDeliveryOption,
    }))
  }, [selectedDeliveryOption])

  // Initialize hooks
  const { supplierOrders, setSupplierOrders, handleSupplierOrderChange, initializeSupplierOrders } = useSupplierOrders({
    levelConfig,
    action,
    setAction,
  })

  const { customerOrders, setCustomerOrders, handleCustomerOrderChange, initializeCustomerOrders } = useCustomerOrders({
    gameState,
    levelConfig,
    action,
    setAction,
  })

  const { isLoading, errorMessage, gameEnded, setGameEnded, processDay, submitLevel } = useGameActions({
    levelId: levelConfig.id,
    gameState,
    setGameState,
    initializeSupplierOrders,
    initializeCustomerOrders,
    setSupplierOrders,
    setCustomerOrders,
    setAction,
    selectedDeliveryOption,
  })

  const {
    getMaterialPriceForSupplier,
    getOrderQuantitiesForSupplier,
    calculateTotalPurchaseCost,
    calculateProductionCost,
    isNextDayButtonDisabled,
    getNextDayDisabledReason,
  } = useGameCalculations({
    gameState,
    levelConfig,
    supplierOrders,
    action,
  })

  // Calculate holding cost using the same inventory valuation system as the game engine
  const calculateHoldingCost = useCallback(() => {
    // Use the same inventory valuation system that treats starting inventory as having no value
    const currentValuation = calculateDailyInventoryValuation(gameState, gameState.day)
    const holdingCosts = calculateInventoryHoldingCosts(currentValuation)
    return holdingCosts.totalHoldingCost
  }, [gameState])

  // Calculate transportation cost separately from purchase cost
  const calculateTransportationCost = useCallback(() => {
    const totalPurchase = calculateTotalPurchaseCost()
    let baseMaterialCost = 0

    for (const order of supplierOrders) {
      const supplier = levelConfig.suppliers.find((s) => s.id === order.supplierId)
      if (!supplier) continue

      // For suppliers with shipment prices, transportation is included
      if (supplier.shipmentPrices) {
        continue
      } else {
        // Calculate base material costs without delivery multiplier
        baseMaterialCost += order.pattyPurchase * (levelConfig.materialBasePrices?.patty || 0)
        baseMaterialCost += order.cheesePurchase * (levelConfig.materialBasePrices?.cheese || 0)
        baseMaterialCost += order.bunPurchase * (levelConfig.materialBasePrices?.bun || 0)
        baseMaterialCost += order.potatoPurchase * (levelConfig.materialBasePrices?.potato || 0)
      }
    }

    return Math.max(0, totalPurchase - baseMaterialCost)
  }, [calculateTotalPurchaseCost, supplierOrders, levelConfig])

  // Calculate revenue from sales and customer orders
  const calculateRevenue = useCallback(() => {
    let totalRevenue = 0

    // Revenue from direct sales attempts
    const salesPrice = levelConfig.salesPrice || levelConfig.sellingPricePerUnit || 25
    totalRevenue += action.salesAttempt * salesPrice

    // Revenue from customer orders
    if (action.customerOrders) {
      for (const customerOrder of action.customerOrders) {
        const customer = levelConfig.customers?.find((c) => c.id === customerOrder.customerId)
        if (customer && customerOrder.quantity > 0) {
          const pricePerUnit = customer.pricePerUnit || salesPrice
          totalRevenue += customerOrder.quantity * pricePerUnit
        }
      }
    }

    return totalRevenue
  }, [action, levelConfig])

  // Check if the game is over
  useEffect(() => {
    if (isLastDay && gameState.day >= levelConfig.daysToComplete) {
      setShowGameOver(true)
    }
  }, [gameState.day, isLastDay, levelConfig.daysToComplete])

  // Handle forecasting completion
  const handleForecastingComplete = useCallback(
    (forecasts: Record<string, number>) => {
      setForecastingCompleted(true)
      setShowForecasting(false)
      toast({
        title: "Forecasting Complete",
        description: "You can now start the level with your forecasts.",
      })
    },
    [toast],
  )

  // Reset all orders
  const resetAllOrders = useCallback(() => {
    try {
      const newSupplierOrders = initializeSupplierOrders()
      setSupplierOrders(newSupplierOrders)

      const newCustomerOrders = initializeCustomerOrders()
      setCustomerOrders(newCustomerOrders)

      setAction({
        supplierOrders: newSupplierOrders,
        production: 0,
        salesAttempt: 0,
        deliveryOptionId: selectedDeliveryOption,
        customerOrders: newCustomerOrders,
      })

      toast({
        title: "Orders Reset",
        description: "All orders for today have been reset.",
      })
    } catch (error) {
      console.error("Error resetting orders:", error)
      toast({
        title: "Error",
        description: "Failed to reset orders. Please try again.",
        variant: "destructive",
      })
    }
  }, [
    initializeSupplierOrders,
    setSupplierOrders,
    initializeCustomerOrders,
    setCustomerOrders,
    setAction,
    selectedDeliveryOption,
    toast,
  ])

  // Event handlers
  const handleProcessDay = useCallback(async (): Promise<void> => {
    await processDay(action)
    if (gameState.day === levelConfig.daysToComplete - 1) {
      setShowGameOver(true)
    }
  }, [processDay, action, gameState.day, levelConfig.daysToComplete])

  const handleSubmitLevel = useCallback(async (): Promise<void> => {
    await submitLevel()
  }, [submitLevel])

  const handleSupplierClick = useCallback(
    (supplierId: number) => {
      const supplier = levelConfig.suppliers?.find((s) => s.id === supplierId)
      if (supplier) {
        setSelectedSupplier(supplier)
        setShowSupplierPopup(true)
      }
    },
    [levelConfig.suppliers],
  )

  const handleFactoryClick = useCallback(() => {
    setShowProductionPopup(true)
  }, [])

  const handleRestaurantClick = useCallback(
    (restaurantIndex: number) => {
      if (levelConfig.customers && levelConfig.customers.length > restaurantIndex) {
        const customer = levelConfig.customers[restaurantIndex]
        setSelectedRestaurant(customer)
        setShowRestaurantPopup(true)
      }
    },
    [levelConfig.customers],
  )

  const handleProductionChange = useCallback(
    (value: string) => {
      const production = Number.parseInt(value, 10)
      if (!isNaN(production) && production >= 0) {
        setAction((prev) => ({
          ...prev,
          production: Math.min(production, gameState.productionCapacity),
        }))
      }
    },
    [gameState.productionCapacity],
  )

  // Calculate max production
  const maxProduction = Math.min(
    gameState.inventory.patty,
    gameState.inventory.cheese,
    gameState.inventory.bun,
    Math.floor(gameState.inventory.potato / 4),
    gameState.productionCapacity,
  )

  // Don't render if forecasting is required but not completed
  if (requiresForecasting && !forecastingCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ForecastingDialog isOpen={showForecasting} onComplete={handleForecastingComplete} levelId={levelConfig.id} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <GameHeader
        levelId={levelConfig.id}
        levelConfig={levelConfig}
        onShowObjectives={() => setShowObjectives(true)}
        onShowTutorial={() => setShowTutorial(true)}
      />

      <StatusBar gameState={gameState} levelConfig={levelConfig} />

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-3">
          <QuickActionsWidget
            levelConfig={levelConfig}
            getMaterialPriceForSupplier={getMaterialPriceForSupplier}
            currentDay={gameState.day}
            supplierOrders={supplierOrders}
            pendingOrders={gameState.pendingOrders}
          />
        </div>

        <div className="md:col-span-6">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle>Supply Chain Map</CardTitle>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  Click on suppliers, factory, or restaurants to interact
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[500px]">
                <SupplyChainMap
                  pendingOrders={gameState.pendingOrders}
                  pendingCustomerOrders={gameState.pendingCustomerOrders}
                  gameState={gameState}
                  levelConfig={levelConfig}
                  level={levelConfig.id}
                  onSupplierClick={handleSupplierClick}
                  onFactoryClick={handleFactoryClick}
                  onRestaurantClick={handleRestaurantClick}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <MarketInfo
            levelConfig={levelConfig}
            pendingOrders={gameState.pendingOrders}
            pendingCustomerOrders={gameState.pendingCustomerOrders}
          />
        </div>
      </div>

      <DailyOrderSummary
        supplierOrders={supplierOrders}
        suppliers={levelConfig.suppliers || []}
        getMaterialPriceForSupplier={getMaterialPriceForSupplier}
        getDeliveryMultiplier={() => {
          const option = levelConfig.deliveryOptions?.find((d) => d.id === action.deliveryOptionId)
          return option ? option.costMultiplier : 1.0
        }}
        production={action.production}
        productionCostPerUnit={levelConfig.productionCostPerUnit}
        customerOrders={customerOrders}
        customers={levelConfig.customers || []}
        levelConfig={levelConfig}
        onResetAllOrders={resetAllOrders}
        isDisabled={isLoading || gameEnded}
      />

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4">
          <InventoryChart data={gameState.history} currentInventory={gameState.inventory} />
        </div>
        <div className="md:col-span-8">
          <CashflowChart data={gameState.history} height={300} profitThreshold={1500} />
        </div>
      </div>

      <CostSummary
        gameState={gameState}
        levelConfig={levelConfig}
        action={action}
        supplierOrders={supplierOrders}
        isLoading={isLoading}
        gameEnded={gameEnded}
        onProcessDay={handleProcessDay}
        calculateTotalPurchaseCost={calculateTotalPurchaseCost}
        calculateProductionCost={calculateProductionCost}
        calculateTransportationCost={calculateTransportationCost}
        calculateHoldingCost={calculateHoldingCost}
        calculateRevenue={calculateRevenue}
        isNextDayButtonDisabled={isNextDayButtonDisabled}
        getNextDayDisabledReason={getNextDayDisabledReason}
      />

      <GameHistory history={gameState.history} />

      <DebugPriceInfo levelConfig={levelConfig} getMaterialPriceForSupplier={getMaterialPriceForSupplier} />

      <GameDialogs
        gameState={gameState}
        levelConfig={levelConfig}
        showChart={showChart}
        setShowChart={setShowChart}
        showMap={showMap}
        setShowMap={setShowMap}
        showTutorial={showTutorial}
        setShowTutorial={setShowTutorial}
        gameEnded={gameEnded}
        setGameEnded={setGameEnded}
        onSubmitLevel={handleSubmitLevel}
        isSubmitting={isLoading}
        level={levelConfig.id}
      />

      <ObjectivesDialog isOpen={showObjectives} onClose={() => setShowObjectives(false)} levelId={levelConfig.id} />

      {user && (
        <GameOverDialog
          isOpen={showGameOver}
          onClose={() => setShowGameOver(false)}
          gameState={gameState}
          levelConfig={levelConfig}
          userId={user.id}
          onSubmitLevel={handleSubmitLevel}
          isSubmitting={isLoading}
        />
      )}

      <SupplierPurchasePopup
        isOpen={showSupplierPopup}
        onClose={() => {
          setShowSupplierPopup(false)
          setSelectedSupplier(null)
        }}
        supplier={selectedSupplier}
        supplierOrders={supplierOrders}
        deliveryOptions={levelConfig.deliveryOptions || []}
        selectedDeliveryOption={selectedDeliveryOption}
        setSelectedDeliveryOption={setSelectedDeliveryOption}
        handleSupplierOrderChange={handleSupplierOrderChange}
        isDisabled={isLoading || gameEnded}
        getMaterialPriceForSupplier={getMaterialPriceForSupplier}
        getOrderQuantitiesForSupplier={getOrderQuantitiesForSupplier}
        gameState={gameState}
        levelConfig={levelConfig}
        setGameState={setGameState}
      />

      <ProductionPopup
        isOpen={showProductionPopup}
        onClose={() => setShowProductionPopup(false)}
        production={action.production}
        maxProduction={maxProduction}
        onProductionChange={handleProductionChange}
        isDisabled={isLoading || gameEnded}
        inventory={gameState.inventory}
      />

      <RestaurantSalesPopup
        isOpen={showRestaurantPopup}
        onClose={() => {
          setShowRestaurantPopup(false)
          setSelectedRestaurant(null)
        }}
        customer={selectedRestaurant}
        customerOrders={customerOrders}
        handleCustomerOrderChange={handleCustomerOrderChange}
        isDisabled={isLoading || gameEnded}
        gameState={gameState}
        day={gameState.day}
        levelConfig={levelConfig}
      />
    </div>
  )
}

export default GameInterface
