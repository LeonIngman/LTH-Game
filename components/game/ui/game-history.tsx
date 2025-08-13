import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { GameHistoryProps } from "@/types/components"

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
                <TableHead>Day</TableHead>
                <TableHead>Cash</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Costs</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Cum. Profit</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry, index) => {
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
                    <TableCell>{safeFormatCurrency(entry.revenue)}</TableCell>
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
