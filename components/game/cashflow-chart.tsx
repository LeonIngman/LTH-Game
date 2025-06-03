"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import type { CashflowChartProps } from "@/types/components" 
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"

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

    // Create initial data for day 0 if no data exists
    let chartData = [...data]
    if (chartData.length === 0) {
      chartData = [
        {
          day: 0,
          totalCost: 0,
          revenue: 0,
          profit: 0,
          inventory: {},
          supplierOrders: [],
          customerOrders: [],
          productionAmount: 0,
        },
      ]
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

    // Create x scale
    const xScale = d3.scaleLinear().domain([minDay, maxDay]).range([0, innerWidth]).nice()

    // Calculate min and max values for y-axis
    const minValue = Math.min(-500, d3.min(sortedData, (d) => d.profit || 0) || 0)
    const maxValue = Math.max(
      d3.max(sortedData, (d) => d.totalCost || 0) || 0,
      d3.max(sortedData, (d) => d.revenue || 0) || 0,
      d3.max(sortedData, (d) => d.profit || 0) || 0,
      profitThreshold || 0,
      500,
    )

    const yMin = Math.floor(minValue / 500) * 500
    const yMax = Math.ceil(maxValue / 500) * 500

    // Create y scale
    const yScale = d3.scaleLinear().domain([yMin, yMax]).nice().range([innerHeight, 0])

    // Create axes
    const xAxis = d3.axisBottom(xScale).ticks(Math.min(maxDay, 8)).tickFormat(d3.format("d"))
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
      .defined((d) => d.totalCost !== undefined && !isNaN(d.totalCost))
      .x((d) => xScale(d.day))
      .y((d) => yScale(d.totalCost || 0))
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
      .datum(sortedData.filter((d) => d.totalCost !== undefined && !isNaN(d.totalCost)))
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
      .data(sortedData.filter((d) => d.totalCost !== undefined && !isNaN(d.totalCost)))
      .enter()
      .append("circle")
      .attr("class", "cost-dot")
      .attr("cx", (d) => xScale(d.day))
      .attr("cy", (d) => yScale(d.totalCost || 0))
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
        d3.select(this).attr("r", 5)
        tooltip
          .style("opacity", 1)
          .html(
            `<div>
              <div><strong>Day:</strong> ${d.day}</div>
              <div><strong>Cost:</strong> ${formatCurrency(d.totalCost || 0)}</div>
              <div><strong>Revenue:</strong> ${formatCurrency(d.revenue || 0)}</div>
              <div><strong>Profit:</strong> ${formatCurrency(d.profit || 0)}${d.profit < 0 ? " (Loss)" : ""}</div>
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
        <CardTitle>Cashflow Chart</CardTitle>
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
