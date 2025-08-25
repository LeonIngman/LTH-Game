"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import type { CashflowChartProps } from "@/types/components"
import type { DailyResult } from "@/types/game"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n"

export function CashflowChart({
  data,
  width,
  height = 300,
  profitThreshold = 1500,
  currentDay = 0,
}: CashflowChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(800)
  const { translations } = useTranslation()

  // Monitor container size changes
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    resizeObserver.observe(containerRef.current)
    setContainerWidth(containerRef.current.offsetWidth)

    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (!svgRef.current) return

    // Create comprehensive chart data starting from day 0
    let chartData = [...data]

    // Always ensure Day 0 exists as the starting point with zero values
    const hasDay0 = chartData.some(d => d.day === 0)
    if (!hasDay0) {
      const day0Entry = {
        day: 0,
        cash: 5000, // Starting cash
        inventory: {
          patty: 0,
          bun: 0,
          cheese: 0,
          potato: 0,
          finishedGoods: 0
        },
        inventoryValue: {
          patty: 0,
          bun: 0,
          cheese: 0,
          potato: 0,
          finishedGoods: 0
        },
        holdingCosts: {
          patty: 0,
          bun: 0,
          cheese: 0,
          potato: 0,
          finishedGoods: 0
        },
        overstockCosts: {
          patty: 0,
          bun: 0,
          cheese: 0,
          potato: 0,
          finishedGoods: 0
        },
        pattyPurchased: 0,
        cheesePurchased: 0,
        bunPurchased: 0,
        potatoPurchased: 0,
        production: 0,
        sales: 0,
        revenue: 0,
        costs: {
          purchases: 0,
          production: 0,
          holding: 0,
          transport: 0,
          total: 0
        },
        profit: 0,
        cumulativeProfit: 0,
        score: 0,
        customerDeliveries: {},
        latenessPenalties: []
      }
      chartData = [day0Entry, ...chartData]
    }

    // Clear any existing chart
    d3.select(svgRef.current).selectAll("*").remove()

    // Use container width or fallback
    const chartWidth = width || Math.max(400, containerWidth - 40)
    const chartHeight = height

    // Set up margins - increased bottom margin for legend
    const margin = { top: 20, right: 20, bottom: 80, left: 70 }
    const innerWidth = chartWidth - margin.left - margin.right
    const innerHeight = chartHeight - margin.top - margin.bottom

    // Create SVG with responsive viewBox
    const svg = d3
      .select(svgRef.current)
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("viewBox", `0 0 ${chartWidth} ${chartHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Sort data by day
    const sortedData = [...chartData].sort((a, b) => a.day - b.day)

    // Find min and max days in the data
    const minDay = 0
    const maxDay = Math.max(20, d3.max(sortedData, (d) => d.day) || 0, currentDay || 0)

    // Create x scale with better spacing control
    const xScale = d3.scaleLinear()
      .domain([minDay, maxDay])
      .range([0, innerWidth])
      .clamp(true)

    // Calculate min and max values for y-axis
    const minValue = Math.min(-500, d3.min(sortedData, (d) => d.profit || 0) || 0)
    const maxValue = Math.max(
      d3.max(sortedData, (d) => d.costs?.total || 0) || 0,
      d3.max(sortedData, (d) => d.revenue || 0) || 0,
      d3.max(sortedData, (d) => d.profit || 0) || 0,
      profitThreshold || 0,
      500,
    )

    const yMin = Math.floor(minValue / 500) * 500
    const yMax = Math.ceil(maxValue / 500) * 500

    // Create y scale
    const yScale = d3.scaleLinear().domain([yMin, yMax]).nice().range([innerHeight, 0])

    // Create axes with better tick formatting for days
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.min(maxDay + 1, 10))
      .tickFormat(d3.format("d"))
      .tickValues(d3.range(0, maxDay + 1).filter(d => d % Math.max(1, Math.floor((maxDay + 1) / 8)) === 0))

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(6)
      .tickFormat((d) => {
        const value = Number(d)
        return `${value >= 0 ? "" : "-"}${Math.abs(value).toLocaleString().replace(/,/g, " ")} kr`
      })

    // Add X axis
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .append("text")
      .attr("class", "axis-label")
      .attr("x", innerWidth / 2)
      .attr("y", 35)
      .attr("fill", "currentColor")
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Day")

    // Add Y axis
    svg
      .append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -50)
      .attr("fill", "currentColor")
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Amount")

    // Add horizontal grid lines
    svg
      .append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(yScale.ticks(6))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", (d) => (d === 0 ? "#9ca3af" : "#e5e7eb"))
      .attr("stroke-width", (d) => (d === 0 ? 1.5 : 1))
      .attr("stroke-dasharray", (d) => (d === 0 ? "none" : "5,5"))

    // Add profit threshold line
    if (profitThreshold) {
      svg
        .append("line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", yScale(profitThreshold))
        .attr("y2", yScale(profitThreshold))
        .attr("stroke", "#f97316")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "10,5")

      svg
        .append("text")
        .attr("x", innerWidth)
        .attr("y", yScale(profitThreshold) - 5)
        .attr("fill", "#f97316")
        .attr("text-anchor", "end")
        .attr("font-weight", "bold")
        .style("font-size", "10px")
        .text(`Target: ${profitThreshold.toLocaleString().replace(/,/g, " ")} kr`)
    }

    // Create line generators
    const costLine = d3
      .line<DailyResult>()
      .defined((d) => d.costs?.total !== undefined && !isNaN(d.costs?.total || 0))
      .x((d) => xScale(d.day))
      .y((d) => yScale(d.costs?.total || 0))
      .curve(d3.curveMonotoneX)

    const revenueLine = d3
      .line<DailyResult>()
      .defined((d) => d.revenue !== undefined && !isNaN(d.revenue))
      .x((d) => xScale(d.day))
      .y((d) => yScale(d.revenue || 0))
      .curve(d3.curveMonotoneX)

    const profitLine = d3
      .line<DailyResult>()
      .defined((d) => d.profit !== undefined && !isNaN(d.profit))
      .x((d) => xScale(d.day))
      .y((d) => yScale(d.profit || 0))
      .curve(d3.curveMonotoneX)

    // Add the line paths
    svg
      .append("path")
      .datum(sortedData.filter((d) => d.costs?.total !== undefined && !isNaN(d.costs?.total || 0)))
      .attr("fill", "none")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 2)
      .attr("d", costLine)

    svg
      .append("path")
      .datum(sortedData.filter((d) => d.revenue !== undefined && !isNaN(d.revenue)))
      .attr("fill", "none")
      .attr("stroke", "#22c55e")
      .attr("stroke-width", 2)
      .attr("d", revenueLine)

    svg
      .append("path")
      .datum(sortedData.filter((d) => d.profit !== undefined && !isNaN(d.profit)))
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("d", profitLine)

    // Add dots for each data point
    svg
      .selectAll(".cost-dot")
      .data(sortedData.filter((d) => d.costs?.total !== undefined && !isNaN(d.costs?.total || 0)))
      .enter()
      .append("circle")
      .attr("class", "cost-dot")
      .attr("cx", (d) => xScale(d.day))
      .attr("cy", (d) => yScale(d.costs?.total || 0))
      .attr("r", 3)
      .attr("fill", "#ef4444")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)

    svg
      .selectAll(".revenue-dot")
      .data(sortedData.filter((d) => d.revenue !== undefined && !isNaN(d.revenue)))
      .enter()
      .append("circle")
      .attr("class", "revenue-dot")
      .attr("cx", (d) => xScale(d.day))
      .attr("cy", (d) => yScale(d.revenue || 0))
      .attr("r", 3)
      .attr("fill", "#22c55e")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)

    svg
      .selectAll(".profit-dot")
      .data(sortedData.filter((d) => d.profit !== undefined && !isNaN(d.profit)))
      .enter()
      .append("circle")
      .attr("class", "profit-dot")
      .attr("cx", (d) => xScale(d.day))
      .attr("cy", (d) => yScale(d.profit || 0))
      .attr("r", 3)
      .attr("fill", "#3b82f6")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)

    // Add legend below the chart
    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(0, ${innerHeight + 50})`)

    const legendItems = [
      { color: "#ef4444", label: "Cost", type: "rect" },
      { color: "#22c55e", label: "Revenue", type: "rect" },
      { color: "#3b82f6", label: "Profit/Loss", type: "rect" },
    ]

    if (profitThreshold) {
      legendItems.push({ color: "#f97316", label: "Profit Target", type: "line" })
    }

    // Calculate spacing for horizontal legend
    const itemWidth = Math.min(120, innerWidth / legendItems.length)

    legendItems.forEach((item, index) => {
      const legendItem = legend.append("g").attr("transform", `translate(${index * itemWidth}, 0)`)

      if (item.type === "line") {
        legendItem
          .append("line")
          .attr("x1", 0)
          .attr("x2", 12)
          .attr("y1", 6)
          .attr("y2", 6)
          .attr("stroke", item.color)
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,3")
      } else {
        legendItem.append("rect").attr("width", 12).attr("height", 12).attr("fill", item.color)
      }

      legendItem
        .append("text")
        .attr("x", 16)
        .attr("y", 9)
        .style("font-size", "10px")
        .style("fill", "currentColor")
        .text(item.label)
    })

    // Add tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "1px solid #ddd")
      .style("border-radius", "4px")
      .style("padding", "8px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("transition", "opacity 0.2s")
      .style("z-index", 1000)
      .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)")
      .style("font-size", "12px")

    const formatCurrency = (value: number) => {
      if (value >= 0) {
        return `${value
          .toFixed(2)
          .replace(/\./g, ",")
          .replace(/\B(?=(\d{3})+(?!\d))/g, " ")} kr`
      } else {
        return `-${Math.abs(value)
          .toFixed(2)
          .replace(/\./g, ",")
          .replace(/\B(?=(\d{3})+(?!\d))/g, " ")} kr`
      }
    }

    // Add hover effects for all dots
    svg
      .selectAll("circle")
      .on("mouseover", function (event, d) {
        const dailyData = d as DailyResult
        d3.select(this).attr("r", 5)
        tooltip
          .style("opacity", 1)
          .html(
            `<div>
              <div><strong>${translations.game.dayHistory}:</strong> ${dailyData.day}</div>
              <div><strong>${translations.game.costsHistory}:</strong> ${formatCurrency(dailyData.costs?.total || 0)}</div>
              <div><strong>${translations.game.revenueHistory}:</strong> ${formatCurrency(dailyData.revenue || 0)}</div>
              <div><strong>${translations.game.profitHistory}:</strong> ${formatCurrency(dailyData.profit || 0)}${dailyData.profit < 0 ? " (Loss)" : ""}</div>
            </div>`,
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`)
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 3)
        tooltip.style("opacity", 0)
      })
      .on("mousemove", (event) => {
        tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY - 28}px`)
      })

    // Clean up tooltip on unmount
    return () => {
      tooltip.remove()
    }
  }, [data, width, height, profitThreshold, currentDay, containerWidth])

  return (
    <Card data-tutorial="cashflow-chart">
      <CardHeader className="pb-2">
        <CardTitle>{translations.game.cashflowChart}</CardTitle>
        <CardDescription>Financial Performance Overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="w-full">
          <svg ref={svgRef} className="w-full h-auto" />
        </div>
      </CardContent>
    </Card>
  )
}
