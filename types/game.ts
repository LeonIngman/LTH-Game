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

export interface PendingOrder {
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
  customerId?: number
}

export interface MapPositions {
  mainFactory: MapPosition
  suppliers: Record<number, MapPosition>
  restaurants: MapPosition[]
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
  pendingSupplierOrders: PendingOrder[]
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
  cumulativePurchases: Record<number, Record<MaterialType, number>> // supplierId -> materialType -> totalPurchased
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
  mapPositions: Record<number, MapPositions>
  overstock: OverstockConfig
  safetystock: SafetystockConfig
}
