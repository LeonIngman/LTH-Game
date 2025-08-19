import { useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { GameHistoryProps } from "@/types/components"
import type { DailyResult } from "@/types/game"

// Define sort types
type SortColumn = 'day' | 'cash' | 'revenue' | 'costs' | 'profit' | 'cumulativeProfit' | 'score'
type SortDirection = 'asc' | 'desc'

interface SortState {
  column: SortColumn | null
  direction: SortDirection
}

/**
 * Safely formats a numeric value to a string with 2 decimal places
 * Returns "N/A" if the value is null, undefined, or not a number
 */
function safeFormatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
    return "N/A"
  }
  return `${value.toFixed(2)} kr`
}

/**
 * Safely format revenue values, treating null/undefined as 0 (no sales = 0 revenue)
 * This is different from other currency fields where null might indicate missing data
 */
function safeFormatRevenue(value: number | null | undefined): string {
  // For revenue, null/undefined means no sales, which equals 0.00 kr
  if (value === null || value === undefined) {
    return "0.00 kr"
  }

  // Handle non-number values (including strings and NaN)
  if (typeof value !== 'number' || isNaN(value)) {
    // Try to recover from string numbers
    if (typeof value === 'string' && (value as string).trim() !== '') {
      const parsed = parseFloat(value as string)
      if (!isNaN(parsed)) {
        return `${parsed.toFixed(2)} kr`
      }
    }

    // If we can't parse it, treat as no sales (including NaN values)
    return "0.00 kr"
  }

  const result = `${value.toFixed(2)} kr`
  return result
}/**
 * Safely formats a numeric value to a string without currency
 * Returns "N/A" if the value is null, undefined, or not a number
 */
function safeFormatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
    return "N/A"
  }
  return value.toString()
}

export function GameHistory({ history }: GameHistoryProps) {
  // Sort state
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: 'asc'
  })

  /**
   * Get value for sorting from a DailyResult entry
   */
  const getSortValue = (entry: DailyResult, column: SortColumn): number | null => {
    switch (column) {
      case 'day':
        return entry.day ?? null
      case 'cash':
        return entry.cash ?? null
      case 'revenue':
        return entry.revenue ?? null
      case 'costs':
        return typeof entry.costs === 'number' ? entry.costs : entry.costs?.total ?? null
      case 'profit':
        return entry.profit ?? null
      case 'cumulativeProfit':
        return entry.cumulativeProfit ?? null
      case 'score':
        return entry.score ?? null
      default:
        return null
    }
  }

  /**
   * Sort history data based on current sort state
   */
  const sortedHistory = [...history].sort((a, b) => {
    if (!sortState.column) return 0

    const valueA = getSortValue(a, sortState.column)
    const valueB = getSortValue(b, sortState.column)

    // Handle N/A values - always put them at the bottom
    if (valueA === null && valueB === null) return 0
    if (valueA === null) return 1
    if (valueB === null) return -1

    // Normal numeric comparison
    const comparison = valueA - valueB
    return sortState.direction === 'asc' ? comparison : -comparison
  })

  /**
   * Handle sort button click
   */
  const handleSort = (column: SortColumn, direction: SortDirection) => {
    setSortState({ column, direction })
  }

  /**
   * Check if a sort button is currently active
   */
  const isSortActive = (column: SortColumn, direction: SortDirection): boolean => {
    return sortState.column === column && sortState.direction === direction
  }

  /**
   * Render sort arrows for a column header
   */
  const renderSortArrows = (column: SortColumn, label: string) => {
    return (
      <div className="flex items-center justify-between w-full">
        <span>{label}</span>
        <div className="flex flex-col ml-2">
          <Button
            variant="ghost"
            size="sm"
            className={`h-4 w-4 p-0 hover:bg-transparent ${isSortActive(column, 'asc')
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
              }`}
            onClick={() => handleSort(column, 'asc')}
            aria-label={`Sort ${label} ascending`}
          >
            <ChevronUp className="h-3 w-3" />
            {isSortActive(column, 'asc') && (
              <span className="sr-only" data-testid="active-sort-indicator">Currently sorted ascending</span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-4 w-4 p-0 hover:bg-transparent ${isSortActive(column, 'desc')
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
              }`}
            onClick={() => handleSort(column, 'desc')}
            aria-label={`Sort ${label} descending`}
          >
            <ChevronDown className="h-3 w-3" />
            {isSortActive(column, 'desc') && (
              <span className="sr-only" data-testid="active-sort-indicator">Currently sorted descending</span>
            )}
          </Button>
        </div>
      </div>
    )
  }
  // If there's no history yet, show a message
  if (history.length === 0) {
    return (
      <Card data-tutorial="game-history">
        <CardHeader>
          <CardTitle>Game History</CardTitle>
          <CardDescription>No history yet. Complete your first day to see results.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card data-tutorial="game-history">
      <CardHeader>
        <CardTitle>Game History</CardTitle>
        <CardDescription>Track your daily performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">
                  {renderSortArrows('day', 'Day')}
                </TableHead>
                <TableHead className="min-w-[120px]">
                  {renderSortArrows('cash', 'Cash')}
                </TableHead>
                <TableHead className="min-w-[120px]">
                  {renderSortArrows('revenue', 'Revenue')}
                </TableHead>
                <TableHead className="min-w-[120px]">
                  {renderSortArrows('costs', 'Costs')}
                </TableHead>
                <TableHead className="min-w-[120px]">
                  {renderSortArrows('profit', 'Profit')}
                </TableHead>
                <TableHead className="min-w-[140px]">
                  {renderSortArrows('cumulativeProfit', 'Cum. Profit')}
                </TableHead>
                <TableHead className="min-w-[100px]">
                  {renderSortArrows('score', 'Score')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHistory.map((entry, index) => {
                // Safely extract costs value
                const costsValue = typeof entry.costs === "number"
                  ? entry.costs
                  : entry.costs?.total ?? null

                // Determine profit styling classes with null safety
                const profitClass = (entry.profit ?? 0) >= 0
                  ? "text-green-600 font-medium"
                  : "text-red-600 font-medium"

                const cumulativeProfitClass = (entry.cumulativeProfit ?? 0) >= 0
                  ? "text-green-600 font-medium"
                  : "text-red-600 font-medium"

                return (
                  <TableRow key={index}>
                    <TableCell>{safeFormatNumber(entry.day)}</TableCell>
                    <TableCell>{safeFormatCurrency(entry.cash)}</TableCell>
                    <TableCell>{safeFormatRevenue(entry.revenue)}</TableCell>
                    <TableCell>{safeFormatCurrency(costsValue)}</TableCell>
                    <TableCell className={profitClass}>
                      {safeFormatCurrency(entry.profit)}
                    </TableCell>
                    <TableCell className={cumulativeProfitClass}>
                      {safeFormatCurrency(entry.cumulativeProfit)}
                    </TableCell>
                    <TableCell>{safeFormatNumber(entry.score)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
