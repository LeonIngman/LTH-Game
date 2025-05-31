import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { LevelConfig, PendingOrder, CustomerOrder } from "@/types/game"
import { Badge } from "@/components/ui/badge"
import { Clock, ArrowDownToLine, ArrowUpFromLine } from "lucide-react"

interface MarketInfoProps {
  levelConfig: LevelConfig
  pendingOrders: PendingOrder[]
  pendingCustomerOrders?: CustomerOrder[]
  onShowMap?: () => void
}

export function MarketInfo({ levelConfig, pendingOrders, pendingCustomerOrders = [], onShowMap }: MarketInfoProps) {
  // Get customer names map
  const customerMap = new Map((levelConfig.customers || []).map((customer) => [customer.id, customer.name]))

  return (
    <Card className="market-info h-full overflow-auto">
      <CardHeader className="pb-2">
        <CardTitle>Current Orders</CardTitle>
        <CardDescription>All pending transactions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingOrders.length === 0 && pendingCustomerOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No pending orders</div>
        ) : (
          <div className="space-y-3">
            {/* Supplier Orders (Buy) */}
            {pendingOrders.map((order, index) => (
              <div key={`supplier-${index}`} className="bg-muted/30 p-3 rounded-md flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">{order.supplierName}</h4>
                    <p className="text-xs text-muted-foreground">{getMaterialName(order.materialType)}</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <ArrowDownToLine className="mr-1 h-3 w-3" />
                    Buy
                  </Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <div className="flex items-center">
                    <span>Quantity: {order.quantity}</span>
                  </div>
                  <div className="flex items-center text-amber-600">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>
                      {order.daysRemaining} {order.daysRemaining === 1 ? "day" : "days"} left
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Customer Orders (Sell) */}
            {pendingCustomerOrders.map((order, index) => (
              <div key={`customer-${index}`} className="bg-muted/30 p-3 rounded-md flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">
                      {customerMap.get(order.customerId) || `Customer ${order.customerId}`}
                    </h4>
                    <p className="text-xs text-muted-foreground">Finished Meals</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <ArrowUpFromLine className="mr-1 h-3 w-3" />
                    Sell
                  </Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <div className="flex items-center">
                    <span>Quantity: {order.quantity}</span>
                  </div>
                  <div className="flex items-center text-amber-600">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>
                      {order.daysRemaining} {order.daysRemaining === 1 ? "day" : "days"} left
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to get a more readable material name
function getMaterialName(materialType: string): string {
  const materialNames: Record<string, string> = {
    patty: "Burger Patties",
    bun: "Burger Buns",
    cheese: "Cheese Slices",
    potato: "Potatoes",
  }

  return materialNames[materialType] || materialType
}
