"use client"

import { useState } from "react"
import { Trophy, ChevronUp, ChevronDown } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

// Define sort types for leaderboard
type SortColumn = 'username' | 'level' | 'day' | 'profit' | 'lastActive'
type SortDirection = 'asc' | 'desc'

interface SortState {
  column: SortColumn | null
  direction: SortDirection
}

interface LeaderboardData {
  id: string
  userId?: string  // Original group ID for currentUser comparison
  username: string
  progress: number
  profit: number
  level: number
  lastActive: string
  levelCompletedDate?: string | null
  day?: number // aktuell dag (timestampNumber)
}

interface LeaderboardProps {
  data: LeaderboardData[]
  currentUser?: string
}

// Format currency with exactly 2 decimal places (Swedish style)
// Convert from öre (database stores in smallest currency unit) to krona
function formatCurrency(amount: number): string {
  const krona = amount / 100
  return krona.toFixed(2).replace(".", ",") + " kr"
}

export function Leaderboard({ data, currentUser }: LeaderboardProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>("all")

  // Sort state - default to profit descending to maintain current behavior
  const [sortState, setSortState] = useState<SortState>({
    column: 'profit',
    direction: 'desc'
  })

  // Use only the data provided from props, do not use mock/demo data
  const validData: LeaderboardData[] = Array.isArray(data) ? data : []

  /**
   * Get value for sorting from a LeaderboardData entry
   */
  const getSortValue = (entry: LeaderboardData, column: SortColumn): string | number | null => {
    switch (column) {
      case 'username':
        return entry.username || ''
      case 'level':
        return entry.level ?? 0
      case 'day':
        return entry.day ?? entry.progress ?? 0
      case 'profit':
        return entry.profit ?? 0
      case 'lastActive':
        return entry.lastActive || ''
      default:
        return null
    }
  }

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

  // Get unique levels for the dropdown
  const levels = ["all", ...Array.from(new Set(validData.map((user) => user.level.toString())))].sort((a, b) => {
    if (a === "all") return -1
    if (b === "all") return 1
    return Number.parseInt(a) - Number.parseInt(b)
  })

  // Filter data by selected level
  const filteredData =
    selectedLevel === "all" ? validData : validData.filter((user) => user.level.toString() === selectedLevel)

  // Sort data based on current sort state
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortState.column) return 0

    const valueA = getSortValue(a, sortState.column)
    const valueB = getSortValue(b, sortState.column)

    // Handle null/undefined values - put them at the bottom
    if (valueA === null && valueB === null) return 0
    if (valueA === null) return 1
    if (valueB === null) return -1

    // String comparison
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      const comparison = valueA.localeCompare(valueB, 'sv-SE')
      return sortState.direction === 'asc' ? comparison : -comparison
    }

    // Numeric comparison
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      const comparison = valueA - valueB
      return sortState.direction === 'asc' ? comparison : -comparison
    }

    // Mixed type comparison - convert to string
    const strA = String(valueA)
    const strB = String(valueB)
    const comparison = strA.localeCompare(strB, 'sv-SE')
    return sortState.direction === 'asc' ? comparison : -comparison
  })

  // Show level column only when viewing all levels
  const showLevelColumn = selectedLevel === "all"

  // Determine the date column header based on selected level
  const dateColumnHeader = selectedLevel === "all" ? "Last Active" : "Completion Date"

  return (
    <Card className="border-[#4d94ff] bg-white">
      <CardHeader className="border-b border-[#4d94ff]">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboard
          </CardTitle>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {levels
                .filter((level) => level !== "all")
                .map((level) => (
                  <SelectItem key={level} value={level}>
                    Level {level}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <CardDescription>
          {selectedLevel === "all"
            ? "Students ranked by profit across all levels"
            : `Students ranked by profit in Level ${selectedLevel}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#4d94ff]">
              <TableHead className="w-12">Rank</TableHead>
              <TableHead className="min-w-[140px]">
                {renderSortArrows('username', 'Grupp')}
              </TableHead>
              {showLevelColumn && (
                <TableHead className="min-w-[80px]">
                  {renderSortArrows('level', 'Nivå')}
                </TableHead>
              )}
              <TableHead className="min-w-[80px]">
                {renderSortArrows('day', 'Dag')}
              </TableHead>
              <TableHead className="min-w-[120px]">
                {renderSortArrows('profit', 'Resultat')}
              </TableHead>
              <TableHead className="hidden md:table-cell min-w-[120px]">
                {renderSortArrows('lastActive', dateColumnHeader)}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((user, index) => {
              const day = user.day ?? user.progress ?? 0
              const isCurrentUser = currentUser === (user.userId || user.id)
              const isNegativeProfit = user.profit < 0

              return (
                <TableRow key={user.id} className={isCurrentUser ? "bg-blue-50" : ""}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    {user.username}
                    {isCurrentUser && " (du)"}
                  </TableCell>
                  {showLevelColumn && (
                    <TableCell className="font-mono">{user.level}</TableCell>
                  )}
                  <TableCell className="font-mono">{day}</TableCell>
                  <TableCell className={`font-mono ${isNegativeProfit ? "text-red-600" : ""}`}>
                    {formatCurrency(user.profit)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {selectedLevel === "all" ? user.lastActive : user.levelCompletedDate || "Pågående"}
                  </TableCell>
                </TableRow>
              )
            })}
            {sortedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={showLevelColumn ? 6 : 5} className="text-center py-4 text-gray-500">
                  Ingen data tillgänglig för detta filter
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
