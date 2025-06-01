import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { GameHistoryEntry } from "@/types/game"

interface GameHistoryProps {
  history: GameHistoryEntry[]
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
              {history.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>{entry.day}</TableCell>
                  <TableCell>{entry.cash.toFixed(2)} kr</TableCell>
                  <TableCell>{entry.revenue.toFixed(2)} kr</TableCell>
                  <TableCell>
                    {typeof entry.costs === "number" ? entry.costs.toFixed(2) : entry.costs.total.toFixed(2)} kr
                  </TableCell>
                  <TableCell className={entry.profit >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {entry.profit.toFixed(2)} kr
                  </TableCell>
                  <TableCell
                    className={entry.cumulativeProfit >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}
                  >
                    {entry.cumulativeProfit.toFixed(2)} kr
                  </TableCell>
                  <TableCell>{entry.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
