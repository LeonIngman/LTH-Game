import type { DailyResult, GameState, LevelConfig, SupplierOrder, CustomerOrder, GameAction, MaterialOrder, CustomerOrder, Customer, Supplier, Inventory } from "@/types/game"
import { Dispatch, SetStateAction } from "react"
import { Action } from "sonner"

export interface CurrentOrdersProps {
  levelConfig: LevelConfig
  pendingOrders: MaterialOrder[]
  pendingCustomerOrders?: CustomerOrder[]
  onShowMap?: () => void
}

export interface GameHeaderProps {
  levelId: number
  levelConfig: LevelConfig
  onShowObjectives: () => void
  onShowTutorial: () => void
}

export interface StatusBarProps {
  gameState: GameState
  levelConfig: LevelConfig
}

export interface CostSummaryProps {
  gameState: GameState
  levelConfig: LevelConfig
  action: GameAction
  supplierOrders: SupplierOrder[]
  isLoading: boolean
  gameEnded: boolean
  onProcessDay: () => Promise<void>
  calculateTotalPurchaseCost: () => number
  calculateProductionCost: () => number
  calculateMaterialPurchaseCost: () => number
  calculateTransportationCost: () => number
  calculateHoldingCost: () => number
  calculateOverstockCost: () => number
  calculateRevenue: () => number
  isNextDayButtonDisabled: () => boolean
  getNextDayDisabledReason: () => string
}

export interface GameHistoryProps {
  history: GameState["history"]
}

export interface GameDialogsProps {
  gameState: GameState
  levelConfig: LevelConfig
  showChart: boolean
  setShowChart: (show: boolean) => void
  showMap: boolean
  setShowMap: (show: boolean) => void
  showTutorial: boolean
  setShowTutorial: (show: boolean) => void
  gameEnded: boolean
  setGameEnded: (ended: boolean) => void
  onSubmitLevel: () => Promise<void>
  isSubmitting: boolean
}

export interface CustomerOrderFormProps {
  customer: Customer
  totalDelivered: number
  customerProgress: number
  scheduleFollowed: boolean
  activeDeliverySchedule: {
    day: number,
    requiredAmount: number
  }[]
  currentGameDay: number
  formatCurrency: (amount: number) => string
  pendingQuantity: number
  setPendingQuantity: Dispatch<SetStateAction<number>>
  setHasConfirmedOrder: Dispatch<SetStateAction<boolean>>
  isDisabled: boolean
  maxSales: number
}

export interface DailyOrderSummaryProps {
  supplierOrders: SupplierOrder[]
  suppliers: Supplier[]
  getMaterialPriceForSupplier: (supplierId: number, materialType: string) => number
  production?: number
  productionCostPerUnit?: number
  customerOrders?: CustomerOrder[]
  customers?: Customer[]
  levelConfig?: LevelConfig
  onResetAllOrders?: () => void
  isDisabled?: boolean
}

export interface PendingOrdersProps {
  pendingOrders: MaterialOrder[]
  pendingCustomerOrders: CustomerOrder[]
  currentDay: number
}

export interface QuickReferenceProps {
  levelConfig: LevelConfig
  getMaterialPriceForSupplier: (supplierId: number, material: string) => number
  currentDay: number
  supplierOrders: SupplierOrder[]
  gameState: GameState
  onEnablePlanningMode?: () => void
  planningMode?: boolean
}

export interface SupplierOrderFormProps {
  supplier: Supplier
  supplierOrder: SupplierOrder
  orderQuantities: number[]
  onOrderChange: (supplierId: number, field: keyof SupplierOrder, value: number) => void
  getMaterialPriceForSupplier: (supplierId: number, materialType: string) => number
  getMaterialCapacity?: (supplier: any, materialType: string) => number
  isMaterialAvailable?: (supplierId: number, materialType: string) => boolean
  disabled: boolean
  gameState: GameState
}

export interface CashflowChartProps {
  data: DailyResult[]
  width?: number
  height?: number
  profitThreshold?: number
  currentDay?: number
}

export interface ChartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameHistory: DailyResult[]
  currentInventory?: any
  currentDay?: number
}

export interface ForecastingDialogProps {
  isOpen: boolean
  onComplete: (forecasts: Record<string, number>) => void
  levelId: number
}

export interface GameInterfaceProps {
  levelId: number | string
}

export interface GameOverDialogProps {
  isOpen: boolean
  onClose: () => void
  gameState: GameState
  levelConfig: LevelConfig
  userId: string
  onSubmitLevel: () => Promise<void>
  isSubmitting: boolean
}

export interface InventoryChartProps {
  data: DailyResult[]
  width?: number
  height?: number
  currentInventory?: Inventory
  overstock?: {
    patty?: { threshold: number }
    cheese?: { threshold: number }
    bun?: { threshold: number }
    potato?: { threshold: number }
    finishedGoods?: { threshold: number }
  }
  safetystock?: {
  patty?: { threshold: number }
  cheese?: { threshold: number }
  bun?: { threshold: number }
  potato?: { threshold: number }
  finishedGoods?: { threshold: number }
  }
}

export interface MapDialogProps {
  open: boolean
  onClose: () => void
  pendingOrders: MaterialOrder[]
  pendingCustomerOrders: CustomerOrder[]
  gameState: GameState
  suppliers: Supplier[]
  customers: Customer[]
  levelConfig: LevelConfig | undefined
  onSupplierClick: (supplier: Supplier) => void
  onFactoryClick: () => void
  onCustomerClick: () => void
  level?: number
}

export interface ObjectivesDialogProps {
  isOpen: boolean
  onClose: () => void
  levelId: number
}

export interface ProductionPopupProps {
  isOpen: boolean
  onClose: () => void
  production: number
  maxProduction: number
  onProductionChange: (value: string) => void
  isDisabled: boolean
  plannedProduction?: number
  forecastData?: Record<string, any> | null
  currentDay?: number
  inventory: Inventory,
  requiresForecasting: boolean
}

export interface ReplayWarningDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  levelName: string
  existingScore: number
  existingProfit: number
}

export interface CostumerSalesPopupProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer | null
  customerOrders: CustomerOrder[]
  handleCustomerOrderChange: (customerId: number, quantity: number) => void
  isDisabled: boolean
  gameState: GameState
  day: number
  levelConfig?: LevelConfig
}

export interface SupplierPurchasePopupProps {
  isOpen: boolean
  onClose: () => void
  supplier: Supplier | null
  supplierOrders: SupplierOrder[]
  handleSupplierOrderChange: (supplierId: number, field: keyof SupplierOrder, value: number) => void
  isDisabled: boolean
  getMaterialPriceForSupplier: (supplierId: number, materialType: string) => number
  getOrderQuantitiesForSupplier: (supplierId: number) => number[]
  gameState: GameState
  levelConfig?: LevelConfig
  setGameState?: (state: GameState) => void
  onOrderConfirmed?: () => void
}

export interface SupplyChainMapProps {
  pendingOrders: MaterialOrder[]
  pendingCustomerOrders?: CustomerOrder[]
  onClose?: () => void
  gameState?: GameState
  suppliers?: Supplier[]
  customers?: Customer[]
  levelConfig?: LevelConfig
  onSupplierClick?: (supplierId: number) => void
  onFactoryClick?: () => void
  onCustomerClick?: (customerId: number) => void
  level?: number // Add level prop
}

export interface TutorialStep {
  title: string
  description: string
  targetSelector: string
  position: "top" | "right" | "bottom" | "left" | "center"
  tabToActivate?: string
}

export interface TutorialOverlayProps {
  steps?: TutorialStep[]
  onComplete: () => void
  isOpen: boolean
  onTabChange?: (tabId: string) => void
  levelId?: number
}