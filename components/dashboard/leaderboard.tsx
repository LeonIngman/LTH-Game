"use client"

import { useState } from "react"
import { Trophy } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface LeaderboardData {
  id: string
  username: string
  progress: number
  profit: number
  level: number
  lastActive: string
  levelCompletedDate?: string
}

interface LeaderboardProps {
  data: LeaderboardData[]
  currentUser?: string
}

// Format currency in Swedish style (spaces as thousands separators)
function formatCurrency(amount: number): string {
  return amount.toLocaleString("sv-SE").replace(/,/g, " ") + " kr"
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
              <TableHead>Username</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead className="hidden md:table-cell">{dateColumnHeader}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((user, index) => (
              <TableRow key={user.id} className={currentUser === user.id ? "bg-blue-50" : ""}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  {user.username}
                  {currentUser === user.id && " (You)"}
                </TableCell>
                <TableCell className="font-mono">{formatCurrency(user.profit)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {selectedLevel === "all" ? user.lastActive : user.levelCompletedDate || "In progress"}
                </TableCell>
              </TableRow>
            ))}
            {sortedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                  No data available for this level
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
