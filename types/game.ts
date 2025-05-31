export interface Inventory {
  patty: number
  bun: number
  cheese: number
  potato: number
}

export interface Supplier {
  id: number
  name: string
  leadTime: number
  capacityPerGame: Record<string, number>
  capacityPerDay: Record<string, number>
  materials: string[]
  shipmentPrices: Record<string, Record<number, number>>
  shipmentPricesIncludeBaseCost: boolean
}

export interface DeliveryOption {
  id: number
  name: string
  costPerUnit: number
  leadTime: number
  capacity: number
}

export interface Customer {
  id: number
  name: string
  location: { x: number; y: number }
  demand: (day: number) => number
}

export interface DailyDemand {
  quantity: number
  price: number
}

// Add the MapPosition interface to the existing types/game.ts file

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

// Update the LevelConfig interface to include mapPositions
export interface LevelConfig {
  id: number
  name: string
  description: string
  initialCash: number
  initialInventory: Inventory
  daysToComplete: number
  productionCostPerUnit: number
  holdingCostPerUnit: number
  sellingPricePerUnit: number
  materialBasePrices: Record<string, number>
  holdingCosts: {
    patty: number
    bun: number
    cheese: number
    potato: number
  }
  orderQuantities: number[]
  suppliers: Supplier[]
  deliveryOptions?: DeliveryOption[]
  customers?: Customer[]
  demandModel: (day: number) => DailyDemand
  maxScore: number
  mapPositions?: Record<number, MapPositions> // Add map positions for each level
}
