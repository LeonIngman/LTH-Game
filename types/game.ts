// Define a union type for material types
export type MaterialType = "patty" | "cheese" | "bun" | "potato"

export interface Inventory {
  patty: number
  bun: number
  cheese: number
  potato: number
  finishedGoods: number
}

export interface InventoryTransaction {
  id: string
  materialType: "patty" | "cheese" | "bun" | "potato"
  quantity: number
  unitCost: number
  totalCost: number
  day: number
  supplierId?: number
  deliveryOptionId?: number
  timestamp: Date | string
}

export interface FinishedGoodsBatch {
  id: string
  quantity: number
  unitCost: number
  totalCost: number
  day: number
  rawMaterialCosts: {
    patty: number
    cheese: number
    bun: number
    potato: number
  }
  productionCost: number
  timestamp: Date | string
}

export interface DailyInventoryValuation {
  day: number
  pattyValue: number
  cheeseValue: number
  bunValue: number
  potatoValue: number
  finishedGoodsValue: number
  totalValue: number
  pattyQuantity: number
  cheeseQuantity: number
  bunQuantity: number
  potatoQuantity: number
  finishedGoodsQuantity: number
}

export interface InventoryHoldingCosts {
  pattyHoldingCost: number
  cheeseHoldingCost: number
  bunHoldingCost: number
  potatoHoldingCost: number
  finishedGoodsHoldingCost: number
  totalHoldingCost: number
}

export interface PendingOrder {
  materialType: string
  quantity: number
  daysRemaining: number
  totalCost: number
  supplierId: number
  deliveryOptionId: number
  deliveryName?: string
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

export interface CustomerOrderAction {
  customerId: number
  quantity: number
}

export interface GameAction {
  supplierOrders: Array<{
    supplierId: number
    pattyPurchase: number
    cheesePurchase: number
    bunPurchase: number
    potatoPurchase: number
  }>
  production: number
  salesAttempt: number
  deliveryOptionId: number
  customerOrders: Array<{
    customerId: number
    quantity: number
  }>
}

export interface DailyResult {
  day: number
  cash: number
  inventory: Inventory
  inventoryValuation: DailyInventoryValuation
  holdingCosts: InventoryHoldingCosts
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
  deliveryOptionId: number
  customerDeliveries?: Record<number, { quantity: number; revenue: number }>
  latenessPenalties?: LatenessPenalty[]
  overstockPenalty?: number
  overstockPenaltyDetails?: Record<string, number>
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
  materials: string[]
  shipmentPrices: Record<string, Record<number, number>>
  randomLeadTime?: boolean
  leadTimeRange?: number[]
  materialPrices: Record<string, number>
}

export interface DeliveryOption {
  id: number
  name: string
  costPerUnit?: number
  leadTime: number
  capacity?: number
  daysToDeliver?: number
  description?: string
}

export interface Customer {
  id: number
  name: string
  description?: string
  location?: { x: number; y: number }
  demand?: (day: number) => number
  leadTime: number
  totalRequirement: number
  deliverySchedule: Array<{ day: number; requiredAmount: number }>
  pricePerUnit: number
  transportCosts: Record<number, number>
  allowedShipmentSizes: number[]
  randomLeadTime?: boolean
  leadTimeRange?: number[]
}

export interface DailyDemand {
  quantity: number
  pricePerUnit: number
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
  patty?: OverstockRule
  bun?: OverstockRule
  cheese?: OverstockRule
  potato?: OverstockRule
  finishedGoods?: OverstockRule
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
  inventoryTransactions: InventoryTransaction[]
  finishedGoodsBatches: FinishedGoodsBatch[]
  dailyInventoryValuations: DailyInventoryValuation[]
  pendingOrders: PendingOrder[]
  pendingCustomerOrders: CustomerOrder[]
  customerDeliveries: Record<number, number>
  supplierDeliveries: Record<number, Record<string, number>>
  dailyDemand: DailyDemand
  productionCapacity: number
  cumulativeProfit: number
  score: number
  history: DailyResult[]
  selectedDeliveryOption: number
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
  deliveryOptions?: DeliveryOption[]
  customers: Customer[]
  demandModel: (day: number) => DailyDemand
  maxScore: number
  mapPositions: Record<number, MapPositions>
  overstock: OverstockConfig
  safetystock: SafetystockConfig
}
