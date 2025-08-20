import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, Calendar, Trophy } from "lucide-react"
import type { GameHistoryOverview } from "@/types/game"

interface GameHistorySummaryProps {
  readonly overview: GameHistoryOverview
  readonly username?: string
}

export function GameHistorySummary({ overview, username }: GameHistorySummaryProps) {
  const scorePercentage = overview.bestScore ? Math.min(Math.round((overview.bestScore / 1000) * 100), 100) : 0
  
  const getTrendIcon = () => {
    switch (overview.progressTrend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = () => {
    switch (overview.progressTrend) {
      case 'improving':
        return 'bg-green-100 text-green-800'
      case 'declining':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("sv-SE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          {username ? `${username}'s Game History` : "Your Game History"}
        </CardTitle>
        <CardDescription>Level: {overview.levelName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Best Score</div>
            <div className="text-sm font-medium">
              {overview.bestScore} points
            </div>
          </div>
          <Progress value={scorePercentage} className="h-2" />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Best Profit</div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(Number(overview.bestProfit))}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Total Attempts</div>
            <div className="text-xl font-bold text-blue-600">
              {overview.totalSessions}
            </div>
          </div>
        </div>

        {/* Performance Trend */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">Progress Trend</div>
            <Badge variant="secondary" className={getTrendColor()}>
              <span className="flex items-center gap-1">
                {getTrendIcon()}
                {overview.progressTrend.charAt(0).toUpperCase() + overview.progressTrend.slice(1)}
              </span>
            </Badge>
          </div>
        </div>

        {/* Average Performance */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Avg Score</div>
            <div className="text-lg font-semibold">
              {Math.round(overview.averageScore)} pts
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Avg Profit</div>
            <div className="text-lg font-semibold">
              {formatCurrency(Number(overview.averageProfit))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Playing History</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">First Played</div>
              <div className="font-medium">{formatDate(overview.firstPlayedAt)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Last Played</div>
              <div className="font-medium">{formatDate(overview.lastPlayedAt)}</div>
            </div>
          </div>
        </div>

        {/* Improvement Indicator */}
        {overview.totalSessions > 1 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Improvement</div>
            <div className="text-sm">
              {overview.bestScore > overview.averageScore ? (
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Best score is {Math.round(((overview.bestScore - overview.averageScore) / overview.averageScore) * 100)}% above average
                </span>
              ) : (
                <span className="text-gray-600">
                  Performance is consistent across attempts
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
