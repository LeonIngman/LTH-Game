"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Bug } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { LevelConfig } from "@/types/game"

interface DebugPriceInfoProps {
  levelConfig: LevelConfig
  getMaterialPriceForSupplier: (supplierId: number, materialType: string) => number
}

export function DebugPriceInfo({ levelConfig, getMaterialPriceForSupplier }: DebugPriceInfoProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Material types
  const materialTypes = ["patty", "cheese", "bun", "potato"]

  // Format material name
  const formatMaterialName = (material: string): string => {
    switch (material) {
      case "patty":
        return "Burger Patties"
      case "cheese":
        return "Cheese Slices"
      case "bun":
        return "Burger Buns"
      case "potato":
        return "Potatoes"
      default:
        return material
    }
  }

  // Format currency
  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || isNaN(amount)) return "N/A"
    return `${amount.toFixed(2)} kr`
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            <span>Debug Price Information</span>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CardTitle>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <div className="space-y-6">
            {/* Base Material Prices */}
            <div>
              <h3 className="font-medium mb-2">Base Material Prices</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Base Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialTypes.map((material) => (
                    <TableRow key={material}>
                      <TableCell>{formatMaterialName(material)}</TableCell>
                      <TableCell>{formatCurrency(levelConfig.materialBasePrices[material])}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Separator />

            {/* Supplier-specific Prices */}
            <div>
              <h3 className="font-medium mb-2">Supplier-specific Material Prices</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    {materialTypes.map((material) => (
                      <TableHead key={material}>{formatMaterialName(material)}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {levelConfig.suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      {materialTypes.map((material) => (
                        <TableCell key={`${supplier.id}-${material}`}>
                          {formatCurrency(getMaterialPriceForSupplier(supplier.id, material))}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Special Shipment Prices */}
            {levelConfig.suppliers.some((s) => s.shipmentPrices) && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">Special Shipment Prices</h3>
                  {levelConfig.suppliers
                    .filter((supplier) => supplier.shipmentPrices)
                    .map((supplier) => (
                      <div key={supplier.id} className="mb-4">
                        <h4 className="text-sm font-medium mb-2">{supplier.name}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {materialTypes.map(
                            (material) =>
                              supplier.shipmentPrices &&
                              supplier.shipmentPrices[material] && (
                                <div key={`${supplier.id}-${material}`} className="bg-gray-50 p-3 rounded-md">
                                  <h5 className="text-sm font-medium mb-2">{formatMaterialName(material)}</h5>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Price</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {Object.entries(supplier.shipmentPrices[material]).map(([quantity, price]) => (
                                        <TableRow key={`${supplier.id}-${material}-${quantity}`}>
                                          <TableCell>{quantity}</TableCell>
                                          <TableCell>{formatCurrency(price)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              ),
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}

            {/* Delivery Options */}
            {levelConfig.deliveryOptions && levelConfig.deliveryOptions.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">Delivery Options</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Option</TableHead>
                        <TableHead>Lead Time (days)</TableHead>
                        <TableHead>Cost Multiplier</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {levelConfig.deliveryOptions.map((option) => (
                        <TableRow key={option.id}>
                          <TableCell className="font-medium">{option.name}</TableCell>
                          <TableCell>{option.leadTime}</TableCell>
                          <TableCell>{option.costMultiplier.toFixed(2)}x</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {/* Other Costs */}
            <Separator />
            <div>
              <h3 className="font-medium mb-2">Other Costs</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cost Type</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Production Cost Per Unit</TableCell>
                    <TableCell>{formatCurrency(levelConfig.productionCostPerUnit)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Holding Cost Per Unit</TableCell>
                    <TableCell>{formatCurrency(levelConfig.holdingCostPerUnit)}</TableCell>
                  </TableRow>
                  {Object.entries(levelConfig.holdingCosts || {}).map(([material, cost]) => (
                    <TableRow key={`holding-${material}`}>
                      <TableCell>{formatMaterialName(material)} Holding Cost</TableCell>
                      <TableCell>{formatCurrency(cost)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell>Selling Price Per Unit</TableCell>
                    <TableCell>{formatCurrency(levelConfig.sellingPricePerUnit)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Raw getMaterialPriceForSupplier Function Output */}
            <Separator />
            <div>
              <h3 className="font-medium mb-2">Raw getMaterialPriceForSupplier Function Output</h3>
              <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[300px]">
                <pre className="text-xs">
                  {levelConfig.suppliers
                    .map((supplier) => {
                      return materialTypes
                        .map((material) => {
                          const price = getMaterialPriceForSupplier(supplier.id, material)
                          return `supplier: ${supplier.name} (id: ${supplier.id}), material: ${material}, price: ${price}\n`
                        })
                        .join("")
                    })
                    .join("\n")}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
