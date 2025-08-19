import type { GameState, LevelConfig, SupplierOrder, CustomerOrder, GameAction, MaterialOrder, MaterialType } from "@/types/game"

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
  insufficientFundsMessage: string | null
  clearInsufficientFundsMessage: () => void
  checkSufficientFunds: () => { sufficient: boolean; message?: string }
}

export interface GameActionsParams {
  levelId: number
  gameState: GameState
  setGameState: (state: GameState) => void
  initializeSupplierOrders: () => SupplierOrder[]
  initializeCustomerOrders: () => CustomerOrder[]
  setSupplierOrders: (orders: SupplierOrder[]) => void
  setCustomerOrders: (orders: CustomerOrder[]) => void
  setAction: (action: GameAction | ((prev: GameAction) => GameAction)) => void
  calculateTotalCost: () => number
}

export interface GameCalculationsHook {
  getMaterialPriceForSupplier: (supplierId: number, materialType: MaterialType) => number
  getOrderQuantitiesForSupplier: (supplierId: number) => number[]
  calculateTotalPurchaseCost: () => number
  calculateProductionCost: () => number
  getHoldingCost: () => number
  getOverstockCost: () => number
  calculateTotalActionCost: () => number
  calculateTotalCost: () => number
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

export interface CustomerOrdersHook {
  customerOrders: CustomerOrder[]
  setCustomerOrders: (orders: CustomerOrder[] | ((prev: CustomerOrder[]) => CustomerOrder[])) => void
  handleCustomerOrderChange: (customerId: number, quantity: number) => void
  resetCustomerOrders: () => void
  initializeCustomerOrders: () => CustomerOrder[]
  calculateTotalCustomerOrderQuantity: (orders?: CustomerOrder[]) => number
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

