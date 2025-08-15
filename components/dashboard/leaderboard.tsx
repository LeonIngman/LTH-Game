"use client"

import { useState } from "react"
import { Trophy } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface LeaderboardData {
  id: string
  userId?: string  // Original user ID for currentUser comparison
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

  // Use only the data provided from props, do not use mock/demo data
  const validData: LeaderboardData[] = Array.isArray(data) ? data : []

  // Get unique levels for the dropdown
  const levels = ["all", ...Array.from(new Set(validData.map((user) => user.level.toString())))].sort((a, b) => {
    if (a === "all") return -1
    if (b === "all") return 1
    return Number.parseInt(a) - Number.parseInt(b)
  })

  // Filter data by selected level
  const filteredData =
    selectedLevel === "all" ? validData : validData.filter((user) => user.level.toString() === selectedLevel)

  // Sort by profit (highest first)
  const sortedData = [...filteredData].sort((a, b) => b.profit - a.profit)

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
              <TableHead>Användare</TableHead>
              {showLevelColumn && <TableHead>Nivå</TableHead>}
              <TableHead>Dag</TableHead>
              <TableHead>Resultat</TableHead>
              <TableHead className="hidden md:table-cell">{dateColumnHeader}</TableHead>
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
