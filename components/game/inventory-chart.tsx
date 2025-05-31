"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"
import type { DailyResult, Inventory } from "@/types/game"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface InventoryChartProps {
  data: DailyResult[]
  width?: number
  height?: number
  currentInventory?: Inventory
}

export function InventoryChart({ data, width = 800, height = 300, currentInventory }: InventoryChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  // Define inventory types and colors - moved outside useEffect for reuse
  const inventoryTypes = ["patty", "cheese", "bun", "potato", "finishedGoods"]
  const inventoryLabels = {
    patty: "Patties",
    cheese: "Cheese",
    bun: "Buns",
    potato: "Potatoes",
    finishedGoods: "Burger Meals",
  }
  const colors = {
    patty: "#ef4444", // red-500
    cheese: "#eab308", // yellow-500
    bun: "#f59e0b", // amber-500
    potato: "#f97316", // orange-500
    finishedGoods: "#22c55e", // green-500
  }

  // Define overstock thresholds
  const overstockThresholds = {
    patty: 100,
    cheese: 250,
    potato: 300,
    finishedGoods: 50,
    // No threshold for buns
  }

  useEffect(() => {
    if (!svgRef.current) return

    // Clear any existing chart
    d3.select(svgRef.current).selectAll("*").remove()

    // Get inventory data to display
    let todayData: { day: number; inventory: Inventory }

    // If we have current inventory directly, use it (for day 0)
    if (currentInventory) {
      todayData = {
        day: data.length > 0 ? data[data.length - 1].day : 0,
        inventory: currentInventory,
      }
    }
    // Otherwise get the most recent day from data
    else if (data && data.length > 0) {
      todayData = [...data].sort((a, b) => b.day - a.day)[0]
    }
    // Fallback to empty inventory if no data available
    else {
      todayData = {
        day: 0,
        inventory: {
          patty: 0,
          cheese: 0,
          bun: 0,
          potato: 0,
          finishedGoods: 0,
        },
      }
    }

    // Set up margins
    const margin = { top: 20, right: 30, bottom: 50, left: 30 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Create scales
    const xScale = d3.scaleBand().domain(inventoryTypes).range([0, innerWidth]).padding(0.3)

    const yScale = d3
      .scaleLinear()
      .domain([0, 500]) // Fixed y-axis from 0 to 500 units
      .range([innerHeight, 0])

    // Add grid lines for better readability
    svg
      .append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(yScale.ticks(5))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "#e5e7eb")
      .attr("stroke-dasharray", "2,2")
      .attr("opacity", 0.7)

    // Create bars for each inventory type
    inventoryTypes.forEach((type) => {
      const value = todayData.inventory[type as keyof typeof todayData.inventory]
      const x = xScale(type)!
      const barWidth = xScale.bandwidth()
      const barHeight = innerHeight - yScale(value)
      const threshold = overstockThresholds[type as keyof typeof overstockThresholds]
      const isOverThreshold = threshold && value > threshold

      // Add bar
      svg
        .append("rect")
        .attr("x", x)
        .attr("y", yScale(value))
        .attr("width", barWidth)
        .attr("height", barHeight)
        .attr("fill", colors[type as keyof typeof colors])
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("rx", 4)
        .attr("data-type", type)
        .attr("data-value", value)
        .attr("class", `bar-${type}`)
        .attr("opacity", isOverThreshold ? 0.9 : 1)

      // Add value label inside the bar
      svg
        .append("text")
        .attr("x", x + barWidth / 2)
        .attr("y", yScale(value) + (barHeight < 30 ? -20 : barHeight / 2))
        .attr("fill", barHeight < 30 ? "currentColor" : "white")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-weight", "bold")
        .attr("font-size", "14px")
        .text(value)

      // Add item type label below the bar
      svg
        .append("text")
        .attr("x", x + barWidth / 2)
        .attr("y", innerHeight + 20)
        .attr("fill", "currentColor")
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text(inventoryLabels[type as keyof typeof inventoryLabels])

      // Add threshold line if applicable
      if (threshold) {
        svg
          .append("line")
          .attr("x1", x)
          .attr("x2", x + barWidth)
          .attr("y1", yScale(threshold))
          .attr("y2", yScale(threshold))
          .attr("stroke", "#000")
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "5,3")
          .attr("opacity", 0.7)

        // Add small threshold indicator
        svg
          .append("text")
          .attr("x", x + barWidth + 5)
          .attr("y", yScale(threshold))
          .attr("fill", "#000")
          .attr("text-anchor", "start")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "10px")
          .text(`${threshold}`)
      }
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

    // Add hover effects for all bars
    svg
      .selectAll("rect")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 0.8)

        const element = d3.select(this)
        const type = element.attr("data-type")
        const value = element.attr("data-value")
        const label = inventoryLabels[type as keyof typeof inventoryLabels]
        const threshold = overstockThresholds[type as keyof typeof overstockThresholds]
        const isOverstock = threshold && Number.parseInt(value) > threshold

        const tooltipContent = `
          <div style="font-weight: bold; margin-bottom: 5px;">Inventory</div>
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 2px 8px 2px 0;">
                <span style="display: inline-block; width: 10px; height: 10px; background-color: ${colors[type as keyof typeof colors]}; margin-right: 5px;"></span>
                ${label}:
              </td>
              <td style="padding: 2px 0; text-align: right; font-weight: 500;">
                ${value} units
                ${
                  isOverstock
                    ? `<span style="color: #ef4444; margin-left: 5px;">(Over threshold: ${threshold})</span>`
                    : ""
                }
              </td>
            </tr>
          </table>
        `

        tooltip
          .style("opacity", 1)
          .html(tooltipContent)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`)
      })
      .on("mouseout", function () {
        const type = d3.select(this).attr("data-type")
        const value = d3.select(this).attr("data-value")
        const threshold = overstockThresholds[type as keyof typeof overstockThresholds]
        const isOverThreshold = threshold && Number.parseInt(value) > threshold

        d3.select(this).attr("opacity", isOverThreshold ? 0.9 : 1)
        tooltip.style("opacity", 0)
      })
      .on("mousemove", (event) => {
        tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY - 28}px`)
      })

    // Clean up tooltip on unmount
    return () => {
      tooltip.remove()
    }
  }, [data, width, height, currentInventory])

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle>Current Inventory</CardTitle>
        <CardDescription>
          Dashed lines represent overstock thresholds. Keeping inventory below these levels helps minimize holding
          costs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg ref={svgRef} className="mx-auto" />
        </div>
      </CardContent>
    </Card>
  )
}
