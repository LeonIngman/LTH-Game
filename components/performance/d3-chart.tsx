"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"

interface D3ChartProps {
  data: any[]
  chartType: string
  width?: number
  height?: number
  overstock?: {
    patty?: { threshold: number }
    bun?: { threshold: number }
    cheese?: { threshold: number }
    potato?: { threshold: number }
    finishedGoods?: { threshold: number }
  }
}

export function D3Chart({ data, chartType, width = 800, height = 400, overstock }: D3ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return

    // Ensure all numeric fields are numbers (fixes .toFixed errors)
    const normalizedData = data.map((d) => ({
      ...d,
      cash: Number(d.cash ?? 0),
      profit: Number(d.profit ?? 0),
      cumulativeProfit: Number(d.cumulativeProfit ?? 0),
      revenue: Number(d.revenue ?? 0),
      pattyInventory: Number(d.pattyInventory ?? 0),
      bunInventory: Number(d.bunInventory ?? 0),
      cheeseInventory: Number(d.cheeseInventory ?? 0),
      potatoInventory: Number(d.potatoInventory ?? 0),
      finishedGoodsInventory: Number(d.finishedGoodsInventory ?? 0),
      production: Number(d.production ?? 0),
      sales: Number(d.sales ?? 0),
      totalCosts: Number(d.totalCosts ?? 0),
      purchaseCosts: Number(d.purchaseCosts ?? 0),
      productionCosts: Number(d.productionCosts ?? 0),
      holdingCosts: Number(d.holdingCosts ?? 0),
      day: Number(d.day ?? 0),
    }))

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(50, 20)`)

    const innerWidth = width - 100
    const innerHeight = height - 60

    // X scale for days
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(normalizedData, (d) => d.day) || 0])
      .range([0, innerWidth])

    // Create X axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(normalizedData.length)
      .tickFormat((d) => `Day ${d}`)
    svg
      .append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)")

    // Add X axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 40)
      .text("Day")

    // Render different chart types
    switch (chartType) {
      case "inventory":
        renderInventoryChart(svg, normalizedData, innerWidth, innerHeight, xScale)
        break
      case "financial":
        renderFinancialChart(svg, normalizedData, innerWidth, innerHeight)
        break
      case "production":
        renderProductionSalesChart(svg, normalizedData, innerWidth, innerHeight)
        break
      case "costs":
        renderCostsChart(svg, normalizedData, innerWidth, innerHeight)
        break
      default:
        renderInventoryChart(svg, normalizedData, innerWidth, innerHeight, xScale)
    }

    // --- Removed overstock warning circles/animations here ---

  }, [data, chartType, width, height, overstock])

  return (
    <div className="relative w-full overflow-x-auto">
      <svg ref={svgRef} className="w-full" style={{ minHeight: height }}></svg>
    </div>
  )
}

// Render inventory levels chart
function renderInventoryChart(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  data: any[],
  width: number,
  height: number,
  xScale: d3.ScaleLinear<number, number>
) {
  // Y scale for inventory levels
  const yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, (d) =>
        Math.max(
          d.pattyInventory || 0,
          d.bunInventory || 0,
          d.cheeseInventory || 0,
          d.potatoInventory || 0,
          d.finishedGoodsInventory || 0,
        ),
      ) || 0,
    ])
    .range([height, 0])
    .nice()

  // Create Y axis
  svg.append("g").call(d3.axisLeft(yScale))

  // Add Y axis label
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -height / 2)
    .text("Inventory Level")

  // Define line generators
  const pattyLine = d3
    .line<any>()
    .x((d) =>
      d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.day) || 0])
        .range([0, width])(d.day),
    )
    .y((d) => yScale(d.pattyInventory || 0))

  const bunLine = d3
    .line<any>()
    .x((d) =>
      d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.day) || 0])
        .range([0, width])(d.day),
    )
    .y((d) => yScale(d.bunInventory || 0))

  const cheeseLine = d3
    .line<any>()
    .x((d) =>
      d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.day) || 0])
        .range([0, width])(d.day),
    )
    .y((d) => yScale(d.cheeseInventory || 0))

  const potatoLine = d3
    .line<any>()
    .x((d) =>
      d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.day) || 0])
        .range([0, width])(d.day),
    )
    .y((d) => yScale(d.potatoInventory || 0))

  const finishedGoodsLine = d3
    .line<any>()
    .x((d) =>
      d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.day) || 0])
        .range([0, width])(d.day),
    )
    .y((d) => yScale(d.finishedGoodsInventory || 0))

  // Add the lines
  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#ef4444")
    .attr("stroke-width", 2)
    .attr("d", pattyLine)

  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#f97316")
    .attr("stroke-width", 2)
    .attr("d", bunLine)

  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#eab308")
    .attr("stroke-width", 2)
    .attr("d", cheeseLine)

  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#84cc16")
    .attr("stroke-width", 2)
    .attr("d", potatoLine)

  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#3b82f6")
    .attr("stroke-width", 2)
    .attr("d", finishedGoodsLine)

  // Add warning circles for overstock
  svg.selectAll(".overstock-warning")
    .data(data.filter(d => {
      const totalOverstock = Object.values(d.overstockCosts as Record<string, number>).reduce((sum, cost) => sum + cost, 0);
      return totalOverstock > 0;
    }))
    .enter()
    .append("circle")
    .attr("class", "overstock-warning")
    .attr("cx", d => xScale(d.day))
    .attr("cy", 10) // Place at the top of the chart
    .attr("r", 8)
    .attr("fill", "#ef4444")
    .attr("opacity", 0.7)
    .append("title")
    .text(d => {
      const totalOverstock = Object.values(d.overstockCosts as Record<string, number>).reduce((sum, cost) => sum + cost, 0);
      return `Overstock cost: ${totalOverstock} kr`;
    })

  // Add legend
  const legend = svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(["Patty", "Bun", "Cheese", "Potato", "Finished Goods"])
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`)

  legend
    .append("rect")
    .attr("x", width - 19)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", (d, i) => ["#ef4444", "#f97316", "#eab308", "#84cc16", "#3b82f6"][i])

  legend
    .append("text")
    .attr("x", width - 24)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text((d) => d)
}

// Render financial metrics chart
function renderFinancialChart(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  data: any[],
  width: number,
  height: number,
) {
  // Y scale for financial values
  const yScale = d3
    .scaleLinear()
    .domain([
      d3.min(data, (d) => Math.min(d.profit || 0, 0)) || 0,
      d3.max(data, (d) => Math.max(d.cash || 0, d.cumulativeProfit || 0, d.revenue || 0)) || 0,
    ])
    .range([height, 0])
    .nice()

  // Create Y axis
  svg.append("g").call(d3.axisLeft(yScale))

  // Add Y axis label
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -height / 2)
    .text("Amount ($)")

  // Define line generators
  const cashLine = d3
    .line<any>()
    .x((d) =>
      d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.day) || 0])
        .range([0, width])(d.day),
    )
    .y((d) => yScale(d.cash || 0))

  const profitLine = d3
    .line<any>()
    .x((d) =>
      d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.day) || 0])
        .range([0, width])(d.day),
    )
    .y((d) => yScale(d.cumulativeProfit || 0))

  const revenueLine = d3
    .line<any>()
    .x((d) =>
      d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.day) || 0])
        .range([0, width])(d.day),
    )
    .y((d) => yScale(d.revenue || 0))

  // Add the lines
  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#3b82f6")
    .attr("stroke-width", 2)
    .attr("d", cashLine)

  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#10b981")
    .attr("stroke-width", 2)
    .attr("d", profitLine)

  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#8b5cf6")
    .attr("stroke-width", 2)
    .attr("d", revenueLine)

  // Add daily profit bars
  const xScale = d3
    .scaleBand()
    .domain(data.map((d) => d.day.toString()))
    .range([0, width])
    .padding(0.1)

  svg
    .selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr(
      "x",
      (d) =>
        d3
          .scaleLinear()
          .domain([0, d3.max(data, (d) => d.day) || 0])
          .range([0, width])(d.day) - 5,
    )
    .attr("y", (d) => (d.profit >= 0 ? yScale(d.profit) : yScale(0)))
    .attr("width", 10)
    .attr("height", (d) => Math.abs(yScale(d.profit) - yScale(0)))
    .attr("fill", (d) => (d.profit >= 0 ? "#10b981" : "#ef4444"))
    .attr("opacity", 0.7)

  // Add legend
  const legend = svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(["Cash", "Cumulative Profit", "Revenue", "Daily Profit"])
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`)

  legend
    .append("rect")
    .attr("x", width - 19)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", (d, i) => ["#3b82f6", "#10b981", "#8b5cf6", "#10b981"][i])

  legend
    .append("text")
    .attr("x", width - 24)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text((d) => d)
}

// Render production and sales chart
function renderProductionSalesChart(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  data: any[],
  width: number,
  height: number,
) {
  // Y scale for production and sales
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => Math.max(d.production || 0, d.sales || 0)) || 0])
    .range([height, 0])
    .nice()

  // Create Y axis
  svg.append("g").call(d3.axisLeft(yScale))

  // Add Y axis label
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -height / 2)
    .text("Units")

  // X scale for bar chart
  const xScale = d3
    .scaleBand()
    .domain(data.map((d) => d.day.toString()))
    .range([0, width])
    .padding(0.1)

  // Add production bars
  svg
    .selectAll(".production-bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "production-bar")
    .attr(
      "x",
      (d) =>
        d3
          .scaleLinear()
          .domain([0, d3.max(data, (d) => d.day) || 0])
          .range([0, width])(d.day) - 15,
    )
    .attr("y", (d) => yScale(d.production || 0))
    .attr("width", 10)
    .attr("height", (d) => height - yScale(d.production || 0))
    .attr("fill", "#3b82f6")
    .attr("opacity", 0.7)

  // Add sales bars
  svg
    .selectAll(".sales-bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "sales-bar")
    .attr(
      "x",
      (d) =>
        d3
          .scaleLinear()
          .domain([0, d3.max(data, (d) => d.day) || 0])
          .range([0, width])(d.day) + 5,
    )
    .attr("y", (d) => yScale(d.sales || 0))
    .attr("width", 10)
    .attr("height", (d) => height - yScale(d.sales || 0))
    .attr("fill", "#10b981")
    .attr("opacity", 0.7)

  // Add legend
  const legend = svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(["Production", "Sales"])
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`)

  legend
    .append("rect")
    .attr("x", width - 19)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", (d, i) => ["#3b82f6", "#10b981"][i])

  legend
    .append("text")
    .attr("x", width - 24)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text((d) => d)
}

// Render costs breakdown chart
function renderCostsChart(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  data: any[],
  width: number,
  height: number,
) {
  // Y scale for costs
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.totalCosts || 0) || 0])
    .range([height, 0])
    .nice()

  // Create Y axis
  svg.append("g").call(d3.axisLeft(yScale))

  // Add Y axis label
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -height / 2)
    .text("Cost ($)")

  // X scale for bar chart
  const xScale = d3
    .scaleBand()
    .domain(data.map((d) => d.day.toString()))
    .range([0, width])
    .padding(0.1)

  // Stack the data
  const stackedData = d3
    .stack()
    .keys(["purchaseCosts", "productionCosts", "holdingCosts"])
    .value((d: any, key) => d[key] || 0)(data)

  // Color scale
  const colorScale = d3
    .scaleOrdinal()
    .domain(["purchaseCosts", "productionCosts", "holdingCosts"])
    .range(["#ef4444", "#f97316", "#3b82f6"])

  // Add stacked bars
  svg
    .append("g")
    .selectAll("g")
    .data(stackedData)
    .enter()
    .append("g")
    .attr("fill", (d: any) => colorScale(d.key) as string)
    .selectAll("rect")
    .data((d: any) => d)
    .enter()
    .append("rect")
    .attr(
      "x",
      (d: any) =>
        d3
          .scaleLinear()
          .domain([0, data.length + 1])
          .range([0, width])(d.data.day) - 10,
    )
    .attr("y", (d: any) => yScale(d[1]))
    .attr("height", (d: any) => yScale(d[0]) - yScale(d[1]))
    .attr("width", 20)
    .attr("opacity", 0.8)

  // Add legend
  const legend = svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(["Purchase Costs", "Production Costs", "Holding Costs"])
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`)

  legend
    .append("rect")
    .attr("x", width - 19)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", (d, i) => ["#ef4444", "#f97316", "#3b82f6"][i])

  legend
    .append("text")
    .attr("x", width - 24)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text((d) => d)
}
