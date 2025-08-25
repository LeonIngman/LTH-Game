"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n"
import type { CurrentOrdersProps } from "@/types/components"
import { Badge } from "@/components/ui/badge"
import { Clock, ArrowDownToLine, ArrowUpFromLine } from "lucide-react"

export function CurrentOrders({ levelConfig, pendingOrders, pendingCustomerOrders = [], onShowMap }: Readonly<CurrentOrdersProps>) {
  const { translations } = useTranslation()

  // Get customer names map
  const customerMap = new Map((levelConfig.customers || []).map((customer) => [customer.id, customer.name]))

  // Helper function to get a more readable material name
  const getMaterialName = (materialType: string): string => {
    const materialNames: Record<string, string> = {
      patty: translations.game.burgerPatties,
      bun: translations.game.burgerBuns,
      cheese: translations.game.cheeseSlices,
      potato: translations.game.potatoes,
    }
    return materialNames[materialType] || materialType
  }

  return (
    <Card className="market-info h-full overflow-auto" data-tutorial="market-info">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg truncate">{translations.game.currentOrders}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">{translations.game.allPendingTransactions}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 h-full">
        {pendingOrders.length === 0 && pendingCustomerOrders.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[200px] text-center text-muted-foreground">
            {translations.game.noPendingOrders}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Supplier Orders (Buy) */}
            {pendingOrders.map((order, index) => (
              <div key={`supplier-${order.supplierId}-${order.materialType}-${index}`} className="bg-muted/30 p-3 rounded-md flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm truncate">{order.supplierName}</h4>
                    <p className="text-xs text-muted-foreground truncate">{getMaterialName(order.materialType)}</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0">
                    <ArrowDownToLine className="mr-1 h-3 w-3" />
                    {translations.game.buy}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <div className="flex items-center min-w-0">
                    <span className="truncate">{translations.game.quantity}: {order.quantity}</span>
                  </div>
                  <div className="flex items-center text-amber-600 flex-shrink-0">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>
                      {order.daysRemaining} {order.daysRemaining === 1 ? translations.game.dayLeft : translations.game.daysLeft}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Customer Orders (Sell) */}
            {pendingCustomerOrders.map((order, index) => (
              <div key={`customer-${order.customerId}-${index}`} className="bg-muted/30 p-3 rounded-md flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm truncate">
                      {customerMap.get(order.customerId) || `${translations.game.customer} ${order.customerId}`}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">{translations.game.finishedMeals}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex-shrink-0">
                    <ArrowUpFromLine className="mr-1 h-3 w-3" />
                    {translations.game.sell}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <div className="flex items-center min-w-0">
                    <span className="truncate">{translations.game.quantity}: {order.quantity}</span>
                  </div>
                  <div className="flex items-center text-amber-600 flex-shrink-0">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>
                      {order.daysRemaining} {order.daysRemaining === 1 ? translations.game.dayLeft : translations.game.daysLeft}
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
