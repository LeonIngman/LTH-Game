import type { GameState, LevelConfig, SupplierOrder, CustomerOrderAction, GameAction, PendingOrder } from "@/types/game"
import type { MATERIAL_TYPES } from "@/lib/constants"

// Define a union type for material types
export type MaterialType = (typeof MATERIAL_TYPES)[number]

// useGameState types
export interface GameStateHook {
  gameState: GameState
  setGameState: (state: GameState) => void
  isGameOver: boolean
  isLastDay: boolean
  resetGameState: () => void
}

// useGameActions types
export interface GameActionsHook {
  isLoading: boolean
  errorMessage: string | null
  gameEnded: boolean
  setGameEnded: (ended: boolean) => void
  processDay: (action: GameAction) => Promise<boolean>
  submitLevel: () => Promise<boolean>
}

export interface GameActionsParams {
  levelId: number
  gameState: GameState
  setGameState: (state: GameState) => void
  initializeSupplierOrders: () => SupplierOrder[]
  initializeCustomerOrders: () => CustomerOrderAction[]
  setSupplierOrders: (orders: SupplierOrder[]) => void
  setCustomerOrders: (orders: CustomerOrderAction[]) => void
  setAction: (action: GameAction | ((prev: GameAction) => GameAction)) => void
  selectedDeliveryOption: number
}

// useGameCalculations types
export interface GameCalculationsHook {
  getMaterialPriceForSupplier: (supplierId: number, materialType: MaterialType) => number
  getOrderQuantitiesForSupplier: (supplierId: number) => number[]
  calculateTotalPurchaseCost: () => number
  calculateProductionCost: () => number
  getHoldingCost: () => number
  calculateTotalActionCost: () => number
  calculateTotalCost: () => number
  getDeliveryMultiplier: () => number
  calculateMaxProduction: number
  isOnlySales: () => boolean
  isNextDayButtonDisabled: () => boolean
  getNextDayDisabledReason: () => string
}

export interface GameCalculationsParams {
  gameState: GameState
  levelConfig: LevelConfig
  supplierOrders: SupplierOrder[]
  action: GameAction
}

// useSupplierOrders types
export interface SupplierOrdersHook {
  supplierOrders: SupplierOrder[]
  setSupplierOrders: (orders: SupplierOrder[] | ((prev: SupplierOrder[]) => SupplierOrder[])) => void
  handleSupplierOrderChange: (supplierId: number, field: keyof SupplierOrder, value: number) => void
  resetSupplierOrders: () => void
  initializeSupplierOrders: () => SupplierOrder[]
  isMaterialAvailable: (supplierId: number, materialType: MaterialType) => boolean
  getMaterialCapacity: (supplierId: number, materialType: MaterialType) => number
  calculateRemainingCapacity: (supplierId: number, materialType?: MaterialType) => number
}

export interface SupplierOrdersParams {
  levelConfig: LevelConfig
  action: GameAction
  setAction: (action: GameAction | ((prev: GameAction) => GameAction)) => void
}

// useCustomerOrders types
export interface CustomerOrdersHook {
  customerOrders: CustomerOrderAction[]
  setCustomerOrders: (orders: CustomerOrderAction[] | ((prev: CustomerOrderAction[]) => CustomerOrderAction[])) => void
  handleCustomerOrderChange: (customerId: number, quantity: number) => void
  resetCustomerOrders: () => void
  initializeCustomerOrders: () => CustomerOrderAction[]
  calculateTotalCustomerOrderQuantity: (orders?: CustomerOrderAction[]) => number
  getRemainingInventoryForCustomers: (customerId?: number) => number
  getCustomerProgressPercentage: (customerId: number) => number
  isDeliveryDueSoon: (customerId: number, day: number) => boolean
  isDeliveryOverdue: (customerId: number, day: number) => boolean
  isCustomerOrderQuantityAvailable: (customerId: number, quantity: number) => boolean
}

export interface CustomerOrdersParams {
  gameState: GameState
  levelConfig: LevelConfig
  action: GameAction
  setAction: (action: GameAction | ((prev: GameAction) => GameAction)) => void
}

// Component prop types
export interface GameHeaderProps {
  levelId: number
  levelConfig: LevelConfig
  onShowTutorial: () => void
  onShowMap: () => void
}

export interface StatusBarProps {
  gameState: GameState
  levelConfig: LevelConfig
}

export interface MarketInfoProps {
  levelConfig: LevelConfig
  pendingOrders: PendingOrder[]
  onShowMap: () => void
}

export interface DailyActionsProps {
  gameState: GameState
  levelConfig: LevelConfig
  action: GameAction
  setAction: (action: GameAction | ((prev: GameAction) => GameAction)) => void
  supplierOrders: SupplierOrder[]
  setSupplierOrders: (orders: SupplierOrder[] | ((prev: SupplierOrder[]) => SupplierOrder[])) => void
  customerOrders: CustomerOrderAction[]
  setCustomerOrders: (orders: CustomerOrderAction[] | ((prev: CustomerOrderAction[]) => CustomerOrderAction[])) => void
  selectedDeliveryOption: number
  setSelectedDeliveryOption: (option: number) => void
  isLoading: boolean
  gameEnded: boolean
  handleSupplierOrderChange: (supplierId: number, field: keyof SupplierOrder, value: number) => void
  handleCustomerOrderChange: (customerId: number, quantity: number) => void
}

export interface CostSummaryProps {
  gameState: GameState
  levelConfig: LevelConfig
  action: GameAction
  supplierOrders: SupplierOrder[]
  isLoading: boolean
  gameEnded: boolean
  onProcessDay: () => void
  onShowChart: () => void
  onShowTutorial: () => void
  calculateTotalPurchaseCost: () => number
  calculateProductionCost: () => number
  calculateHoldingCost: () => number
  calculateTotalCost: () => number
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
