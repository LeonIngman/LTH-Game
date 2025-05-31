"use client"

import { useState } from "react"
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PerformanceData {
  id: number
  timestampId: number
  timestampNumber: number
  rawMaterialAStock: number
  rawMaterialBStock: number
  finishedGoodStock: number
  cashFlow: number
  cumulativeProfit: number
  score: number
  decisions?: {
    rawMaterialAPurchase?: number
    rawMaterialBPurchase?: number
    production?: number
    sales?: number
  }
}

interface PerformanceChartsProps {
  performanceData: PerformanceData[]
  levelName: string
}

export function PerformanceCharts({ performanceData, levelName }: PerformanceChartsProps) {
  const [activeTab, setActiveTab] = useState("profit")

  // Define fixed colors for profit bars
  const positiveColor = "#86efac" // light green
  const negativeColor = "#fca5a5" // light red

  // Safely format data for charts with fallbacks for missing properties
  const chartData = performanceData.map((data) => ({
    timestampNumber: data.timestampNumber || 0,
    rawMaterialAStock: data.rawMaterialAStock || 0,
    rawMaterialBStock: data.rawMaterialBStock || 0,
    finishedGoodStock: data.finishedGoodStock || 0,
    cashFlow: Number(data.cashFlow || 0),
    cumulativeProfit: Number(data.cumulativeProfit || 0),
    score: data.score || 0,
    rawMaterialAPurchase: data.decisions?.rawMaterialAPurchase || 0,
    rawMaterialBPurchase: data.decisions?.rawMaterialBPurchase || 0,
    production: data.decisions?.production || 0,
    sales: data.decisions?.sales || 0,
    profit: Number((data.decisions?.sales || 0) - (data.decisions?.production || 0)), // Calculate daily profit
    isPositive: (data.decisions?.sales || 0) - (data.decisions?.production || 0) >= 0, // Pre-calculate if profit is positive
  }))

  // If no data is available, show a message
  if (!performanceData || performanceData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Performance Metrics - {levelName || "Unknown Level"}</CardTitle>
          <CardDescription>No performance data available</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No data available for this level</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Performance Metrics - {levelName || "Unknown Level"}</CardTitle>
        <CardDescription>Track your performance across different metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="profit">Profit & Cash Flow</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Levels</TabsTrigger>
            <TabsTrigger value="decisions">Decisions</TabsTrigger>
            <TabsTrigger value="score">Score</TabsTrigger>
          </TabsList>

          <TabsContent value="profit" className="space-y-4">
            <Tabs defaultValue="line" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="line">Line Chart</TabsTrigger>
                <TabsTrigger value="bar">Bar Chart</TabsTrigger>
              </TabsList>

              <TabsContent value="line">
                <ChartContainer
                  config={{
                    cashFlow: {
                      label: "Cash Flow",
                      color: "hsl(var(--chart-1))",
                    },
                    cumulativeProfit: {
                      label: "Cumulative Profit",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestampNumber"
                        label={{ value: "Time Period", position: "insideBottom", offset: -5 }}
                      />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="cashFlow" stroke="var(--color-cashFlow)" name="Cash Flow" />
                      <Line
                        type="monotone"
                        dataKey="cumulativeProfit"
                        stroke="var(--color-cumulativeProfit)"
                        name="Cumulative Profit"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </TabsContent>

              <TabsContent value="bar">
                <ChartContainer
                  config={{
                    profit: {
                      label: "Daily Profit",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestampNumber"
                        label={{ value: "Time Period", position: "insideBottom", offset: -5 }}
                      />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="profit" name="Daily Profit" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.isPositive ? positiveColor : negativeColor} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <ChartContainer
              config={{
                rawMaterialAStock: {
                  label: "Raw Material A",
                  color: "hsl(var(--chart-1))",
                },
                rawMaterialBStock: {
                  label: "Raw Material B",
                  color: "hsl(var(--chart-2))",
                },
                finishedGoodStock: {
                  label: "Finished Goods",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestampNumber"
                    label={{ value: "Time Period", position: "insideBottom", offset: -5 }}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rawMaterialAStock"
                    stroke="var(--color-rawMaterialAStock)"
                    name="Raw Material A"
                  />
                  <Line
                    type="monotone"
                    dataKey="rawMaterialBStock"
                    stroke="var(--color-rawMaterialBStock)"
                    name="Raw Material B"
                  />
                  <Line
                    type="monotone"
                    dataKey="finishedGoodStock"
                    stroke="var(--color-finishedGoodStock)"
                    name="Finished Goods"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="decisions" className="space-y-4">
            <ChartContainer
              config={{
                rawMaterialAPurchase: {
                  label: "Material A Purchase",
                  color: "hsl(var(--chart-1))",
                },
                rawMaterialBPurchase: {
                  label: "Material B Purchase",
                  color: "hsl(var(--chart-2))",
                },
                production: {
                  label: "Production",
                  color: "hsl(var(--chart-3))",
                },
                sales: {
                  label: "Sales",
                  color: "hsl(var(--chart-4))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestampNumber"
                    label={{ value: "Time Period", position: "insideBottom", offset: -5 }}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rawMaterialAPurchase"
                    stroke="var(--color-rawMaterialAPurchase)"
                    name="Material A Purchase"
                  />
                  <Line
                    type="monotone"
                    dataKey="rawMaterialBPurchase"
                    stroke="var(--color-rawMaterialBPurchase)"
                    name="Material B Purchase"
                  />
                  <Line type="monotone" dataKey="production" stroke="var(--color-production)" name="Production" />
                  <Line type="monotone" dataKey="sales" stroke="var(--color-sales)" name="Sales" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="score" className="space-y-4">
            <ChartContainer
              config={{
                score: {
                  label: "Score",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestampNumber"
                    label={{ value: "Time Period", position: "insideBottom", offset: -5 }}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="var(--color-score)" name="Score" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
