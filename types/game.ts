// Define a union type for material types
export type MaterialType = "patty" | "cheese" | "bun" | "potato"

export interface Inventory {
  patty: number
  bun: number
  cheese: number
  potato: number
  finishedGoods: number
}

export interface InventoryValue {
  patty: number
  cheese: number
  bun: number
  potato: number
  finishedGoods: number
}

export interface InventoryHoldingCosts {
  patty: number
  cheese: number
  bun: number
  potato: number
  finishedGoods: number
}

export interface InventoryOverstockCosts {
  patty: number
  cheese: number
  bun: number
  potato: number
  finishedGoods: number
}

export interface MaterialOrder {
  materialType: MaterialType
  quantity: number
  daysRemaining: number
  totalCost: number
  supplierId: number
  supplierName?: string
  actualLeadTime?: number
}

export interface CustomerOrder {
  customerId: number
  quantity: number
  daysRemaining: number
  totalRevenue: number
  transportCost: number
  netRevenue: number
  actualLeadTime?: number
}

export interface LatenessPenalty {
  customerId: number
  customerName: string
  day: number
  missedAmount: number
  penaltyAmount: number
}

// Game History Types
export interface GameSession {
  id?: string
  userId: string
  levelId: number
  gameState: any
  isCompleted: boolean
  startedAt: Date
  completedAt?: Date
  updatedAt: Date
  finalScore?: number
  finalProfit?: number
  daysPlayed?: number
}

export interface GameHistoryEntry {
  id: number
  userId: string
  levelId: number
  sessionId?: string
  score: number
  cumulativeProfit: number
  cashFlow: number
  rawMaterialAStock: number
  rawMaterialBStock: number
  finishedGoodStock: number
  decisions: any
  createdAt: Date
  session?: GameSession
  levelName?: string
}

export interface GameHistoryOverview {
  userId: string
  username?: string
  levelId: number
  levelName: string
  totalSessions: number
  bestScore: number
  bestProfit: number
  averageScore: number
  averageProfit: number
  firstPlayedAt: Date
  lastPlayedAt: Date
  progressTrend: 'improving' | 'stable' | 'declining'
}

export interface SessionComparison {
  sessionId1: string
  sessionId2: string
  session1: GameHistoryEntry
  session2: GameHistoryEntry
  improvements: {
    score: number
    profit: number
    efficiency: number
  }
  differences: {
    decisions: any[]
    outcomes: any[]
  }
}

export interface SupplierOrder {
  supplierId: number
  pattyPurchase: number
  cheesePurchase: number
  bunPurchase: number
  potatoPurchase: number
}

export interface CustomerOrder {
  customerId: number
  quantity: number
}

export interface GameAction {
  supplierOrders: SupplierOrder[]
  production: number
  customerOrders: CustomerOrder[]
}

export interface DailyResult {
  day: number
  cash: number
  inventory: Inventory
  inventoryValue: InventoryValue
  holdingCosts: InventoryHoldingCosts
  overstockCosts: InventoryOverstockCosts
  pattyPurchased: number
  cheesePurchased: number
  bunPurchased: number
  potatoPurchased: number
  production: number
  sales: number
  revenue: number
  costs: {
    purchases: number
    production: number
    holding: number
    transport: number
    total: number
  }
  profit: number
  cumulativeProfit: number
  score: number
  customerDeliveries?: Record<number, { quantity: number; revenue: number }>
  latenessPenalties?: LatenessPenalty[]
}

export interface GameResult {
  levelId: number
  userId: string
  finalDay: number
  finalCash: number
  finalInventory: Inventory
  cumulativeProfit: number
  score: number
  history: DailyResult[]
}

export interface Supplier {
  id: number
  name: string
  leadTime: number
  capacityPerGame: Record<string, number>
  materials: MaterialType[]
  shipmentPrices: Record<string, Record<number, number>>
  randomLeadTime?: boolean
  leadTimeRange?: number[]
  materialPrices: Record<string, number>
}

export interface Customer {
  id: number
  name: string
  description?: string
  location?: { x: number; y: number }
  leadTime: number
  totalRequirement: number
  deliverySchedule: Array<{ day: number; requiredAmount: number }>
  pricePerUnit: number
  transportCosts: Record<number, number>
  allowedShipmentSizes: number[]
  randomLeadTime?: boolean
  leadTimeRange?: number[]
}

export interface MapPosition {
  x: number
  y: number
  name?: string
  id?: number
}

export interface MapPositions {
  mainFactory: MapPosition
  suppliers: MapPosition[]
  customers: MapPosition[]
}

interface OverstockRule {
  threshold: number
  penaltyPerUnit: number
}

export interface OverstockConfig {
  patty: OverstockRule
  bun: OverstockRule
  cheese: OverstockRule
  potato: OverstockRule
  finishedGoods: OverstockRule
}

interface SafetystockRule {
  threshold: number
}

export interface SafetystockConfig {
  patty?: SafetystockRule
  bun?: SafetystockRule
  cheese?: SafetystockRule
  potato?: SafetystockRule
}

export interface GameState {
  day: number
  cash: number
  inventory: Inventory
  inventoryValue: InventoryValue
  pendingSupplierOrders: MaterialOrder[]
  pendingCustomerOrders: CustomerOrder[]
  customerDeliveries: Record<number, number>
  supplierDeliveries: Record<number, Record<string, number>>
  cumulativeProfit: number
  score: number
  history: DailyResult[]
  gameOver: boolean
  latenessPenalties: LatenessPenalty[]
  overstockPenalties?: Array<{ day: number; penalty: number; details: Record<string, number> }>
  forecastData?: Record<string, any> | null
}

export interface LevelConfig {
  id: number
  name: string
  description: string
  initialCash: number
  initialInventory: Inventory
  daysToComplete: number
  productionCostPerUnit: number
  holdingCosts: {
    patty: number
    bun: number
    cheese: number
    potato: number
    finishedGoods?: number
  }
  suppliers: Supplier[]
  customers: Customer[]
  maxScore: number
  mapPositions: MapPositions
  overstock: OverstockConfig
  safetystock: SafetystockConfig
}
