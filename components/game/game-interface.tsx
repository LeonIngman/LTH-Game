"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Supplier, Customer, LevelConfig, GameAction } from "@/types/game"
import type { GameInterfaceProps } from "@/types/components"
import { level0Config } from "@/lib/game/level0"
import { level1Config } from "@/lib/game/level1"
import { level2Config } from "@/lib/game/level2"
import { level3Config } from "@/lib/game/level3"
import { useAuth } from "@/lib/auth-context"
import { calculateDailyInventoryValuation, calculateInventoryHoldingCosts } from "@/lib/game/inventory-management"

// Import our UI components
import { GameHeader } from "./ui/game-header"
import { StatusBar } from "./ui/status-bar"
import { CurrentOrders } from "./ui/current-orders"
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
import { QuickReference } from "./ui/quick-reference"
import { TutorialOverlay } from "./tutorial-overlay"

// Import our custom hooks
import { useGameState } from "@/hooks/use-game-state"
import { useGameActions } from "@/hooks/use-game-actions"
import { useGameCalculations } from "@/hooks/use-game-calculations"
import { useSupplierOrders } from "@/hooks/use-supplier-orders"
import { useCustomerOrders } from "@/hooks/use-customer-orders"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"


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
      levelConfig.demandModel = (day) => ({ quantity: 10, pricePerUnit: 30, price: 30 })
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
  const [objectivesCompleted, setObjectivesCompleted] = useState<boolean>(false)
  const [showGameOver, setShowGameOver] = useState<boolean>(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [showSupplierPopup, setShowSupplierPopup] = useState<boolean>(false)
  const [showProductionPopup, setShowProductionPopup] = useState<boolean>(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Customer | null>(null)
  const [showRestaurantPopup, setShowRestaurantPopup] = useState<boolean>(false)
  const [forecastData, setForecastData] = useState<Record<string, any> | null>(null)


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
    return 0
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

  // Show objectives dialog first for all levels, then forecasting for levels 2 and 3
  useEffect(() => {
    if (gameState.day === 1) {
      if (!objectivesCompleted) {
        setShowObjectives(true)
      } else if (requiresForecasting && !forecastingCompleted) {
        setShowForecasting(true)
      }
    }
  }, [objectivesCompleted, requiresForecasting, forecastingCompleted, gameState.day])

  // Update action when delivery option changes
  useEffect(() => {
    setAction((prev: any) => ({
      ...prev,
      deliveryOptionId: selectedDeliveryOption,
    }))
  }, [selectedDeliveryOption])

  // Store forecast data in game state when it's available
  useEffect(() => {
    if (forecastData && gameState) {
      setGameState((prev) => ({
        ...prev,
        forecastData: forecastData, // ← NEW: Store forecast data in game state
      }))
    }
  }, [forecastData, setGameState])

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

  // Calculates only the base material purchase cost (no transport)
  const calculateMaterialPurchaseCost = useCallback(() => {
    let total = 0
    for (const order of supplierOrders) {
      const supplier = levelConfig.suppliers.find((s) => s.id === order.supplierId)
      if (!supplier || !supplier.materialPrices) continue
      if (order.pattyPurchase > 0) total += order.pattyPurchase * (supplier.materialPrices?.patty || 0)
      if (order.cheesePurchase > 0) total += order.cheesePurchase * (supplier.materialPrices?.cheese || 0)
      if (order.bunPurchase > 0) total += order.bunPurchase * (supplier.materialPrices?.bun || 0)
      if (order.potatoPurchase > 0) total += order.potatoPurchase * (supplier.materialPrices?.potato || 0)
    }
    return total
  }, [supplierOrders, levelConfig])

  // Calculates only the transportation cost (shipment/delivery)
  const calculateTransportationCost = useCallback(() => {
    let total = 0
    for (const order of supplierOrders) {
      const supplier = levelConfig.suppliers.find((s) => s.id === order.supplierId)
      if (!supplier || !supplier.shipmentPrices) continue

      // For each material, find the closest shipment size and add its price
      for (const material of ["patty", "cheese", "bun", "potato"]) {
        const amount = order[`${material}Purchase`]
        if (amount > 0 && supplier.shipmentPrices[material]) {
          const sizes = Object.keys(supplier.shipmentPrices[material]).map(Number)
          // Find the closest shipment size (or the largest not exceeding the amount)
          const closest = sizes.reduce((prev, curr) =>
            Math.abs(curr - amount) < Math.abs(prev - amount) ? curr : prev
          )
          total += supplier.shipmentPrices[material][closest]
        }
      }
    }
    return total
  }, [supplierOrders, levelConfig])

  // Calculate revenue from sales and customer orders
  const calculateRevenue = useCallback(() => {
    let totalRevenue = 0

    // Revenue from direct sales attempts
    const salesPrice = levelConfig.sellingPricePerUnit || 25
    totalRevenue += action.salesAttempt * salesPrice

    // Revenue from customer orders
    if (action.customerOrders) {
      for (const customerOrder of action.customerOrders) {
        const customer = levelConfig.customers?.find((c) => c.id === customerOrder.customerId)
        if (customer && customerOrder.quantity > 0) {
          const pricePerUnit = (customer as any).pricePerUnit || salesPrice
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
  (forecasts: Record<string, any>) => {
    setForecastingCompleted(true)
    setShowForecasting(false)
    setForecastData(forecasts)

    toast({
      title: "Forecasting Complete",
      description: "You can now start the level with your forecasts.",
    })
  },
  [toast],
)

// Get today's planned production
const getTodaysPlannedProduction = useCallback(() => {
  if (!forecastData?.productionRates) return undefined
  return forecastData.productionRates[gameState.day] || 0 // ← NEW: Get current day's production
}, [forecastData, gameState.day])

  // Handle objectives completion
  const handleObjectivesComplete = useCallback(() => {
    setObjectivesCompleted(true)
    setShowObjectives(false)

    // If this level requires forecasting, show it next
    if (requiresForecasting && !forecastingCompleted) {
      setShowForecasting(true)
    }

    toast({
      title: "Objectives Reviewed",
      description: "You can now proceed with the level.",
    })
  }, [requiresForecasting, forecastingCompleted, toast])

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
        setAction((prev: any) => ({
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
  // if (requiresForecasting && !forecastingCompleted) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <ObjectivesDialog isOpen={showObjectives} onClose={handleObjectivesComplete} levelId={levelConfig.id} />
  //       <ForecastingDialog isOpen={showForecasting} onComplete={handleForecastingComplete} levelId={levelConfig.id} />
  //     </div>
  //   )
  // }

// Added function to render dialogs
const renderDialogs = () => (
  <>
    <ObjectivesDialog isOpen={showObjectives} onClose={handleObjectivesComplete} levelId={levelConfig.id} />

    {requiresForecasting && (
      <ForecastingDialog isOpen={showForecasting} onComplete={handleForecastingComplete} levelId={levelConfig.id} />
    )}
  </>
)

// Added function to calculate planned production
const getPlannedProduction = useCallback(() => {
  if (!forecastData) return undefined

  if (forecastData.productionRates) {
    // Sum up the production rates for all days
    console.log(forecastData.productionRates)
    return Object.values(forecastData.productionRates)//.reduce((sum: number, rate: number) => sum + rate, 0)
  } else {
    // Sum up the customer forecasts
    return (forecastData["yummy-zone"] || 0) + (forecastData["toast-to-go"] || 0) + (forecastData["study-fuel"] || 0)
  }
}, [forecastData])

  const lastDayPenalty =
    gameState.overstockPenalties && gameState.overstockPenalties.length > 0
      ? gameState.overstockPenalties[gameState.overstockPenalties.length - 1]
      : null

  return (
    <div className="space-y-6">
      {renderDialogs()} 
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

      {/* Show forecasting status for levels with forecasting */}
      {requiresForecasting && forecastingCompleted && getTodaysPlannedProduction() !== undefined && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Automatic Production Active</AlertTitle>
          <AlertDescription>
            Today's planned production: {getTodaysPlannedProduction()} meals (based on your forecasting plan)
          </AlertDescription>
        </Alert>
      )}

      {lastDayPenalty && Number(lastDayPenalty.penalty ?? 0) > 0 && (
        <div className="mb-4 rounded bg-red-100 text-red-700 p-3 flex items-center gap-2">
          <span>
            ⚠️ Overstock penalty applied: {Number(lastDayPenalty.penalty ?? 0).toFixed(2)} kr
          </span>
          {lastDayPenalty.details &&
            Object.entries(lastDayPenalty.details ?? {}).map(([item, value]) =>
              <span key={item} className="ml-2 text-xs">{item}: {Number(value ?? 0).toFixed(2)} kr</span>
            )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-3">
          <QuickReference
            levelConfig={levelConfig}
            getMaterialPriceForSupplier={getMaterialPriceForSupplier as (supplierId: number, materialType: string) => number}
            currentDay={gameState.day}
            supplierOrders={supplierOrders}
            pendingOrders={gameState.pendingOrders}
            gameState={gameState}
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
          <CurrentOrders
            levelConfig={levelConfig}
            pendingOrders={gameState.pendingOrders}
            pendingCustomerOrders={gameState.pendingCustomerOrders}
          />
        </div>
      </div>

      <DailyOrderSummary
        supplierOrders={supplierOrders}
        suppliers={levelConfig.suppliers || []}
        getMaterialPriceForSupplier={getMaterialPriceForSupplier as (supplierId: number, materialType: string) => number}
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
          <InventoryChart
            data={gameState.history}
            currentInventory={gameState.inventory}
            overstock={levelConfig.overstock}
            safetystock={levelConfig.safetystock}
          />
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
        calculateMaterialPurchaseCost={calculateMaterialPurchaseCost}
        calculateTransportationCost={calculateTransportationCost}
        calculateHoldingCost={calculateHoldingCost}
        calculateRevenue={calculateRevenue}
        isNextDayButtonDisabled={isNextDayButtonDisabled}
        getNextDayDisabledReason={getNextDayDisabledReason}
      />

      <GameHistory history={gameState.history} />

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

      <ObjectivesDialog isOpen={showObjectives} onClose={handleObjectivesComplete} levelId={levelConfig.id} />

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
        getMaterialPriceForSupplier={getMaterialPriceForSupplier as (supplierId: number, materialType: string) => number}
        getOrderQuantitiesForSupplier={getOrderQuantitiesForSupplier}
        gameState={gameState}
        levelConfig={levelConfig}
        setGameState={setGameState}
        onOrderConfirmed={() => {
          setShowSupplierPopup(false)
          setSelectedSupplier(null)
        }}
      />

      <ProductionPopup
        isOpen={showProductionPopup}
        onClose={() => setShowProductionPopup(false)}
        production={getTodaysPlannedProduction() || action.production}
        maxProduction={maxProduction}
        onProductionChange={handleProductionChange}
        isDisabled={isLoading || gameEnded}
        plannedProduction={getPlannedProduction()}
        forecastData={forecastData}
        currentDay={gameState.day}
        inventory={gameState.inventory}
        requiresForecasting={requiresForecasting}
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
      {/* Tutorial Overlay for Level 0 */}
      {levelConfig.id === 0 && (
        <TutorialOverlay onComplete={() => setShowTutorial(false)} isOpen={showTutorial} levelId={levelConfig.id} />
      )}
    </div>
  )

  function handleShowTutorial() {
    if (levelConfig.id === 0) {
      setShowTutorial(true)
    } else {
      setShowTutorial(true)
    }
  }
}

export default GameInterface;
