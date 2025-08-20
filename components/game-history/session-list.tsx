import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Trophy, TrendingUp, TrendingDown, Eye, Calendar } from "lucide-react"
import type { GameHistoryEntry } from "@/types/game"

interface SessionListProps {
  readonly sessions: GameHistoryEntry[]
  readonly onViewDetails?: (session: GameHistoryEntry) => void
  readonly isLoading?: boolean
}

export function SessionList({ sessions, onViewDetails, isLoading = false }: SessionListProps) {
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
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const getPerformanceChange = (currentSession: GameHistoryEntry, index: number) => {
    if (index === sessions.length - 1) return null // First session, no comparison
    
    const previousSession = sessions[index + 1]
    const scoreChange = currentSession.score - previousSession.score
    const profitChange = Number(currentSession.cumulativeProfit) - Number(previousSession.cumulativeProfit)
    
    return { scoreChange, profitChange }
  }

  const getPerformanceBadge = (scoreChange: number) => {
    if (scoreChange > 0) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <TrendingUp className="h-3 w-3 mr-1" />
          +{scoreChange} pts
        </Badge>
      )
    } else if (scoreChange < 0) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <TrendingDown className="h-3 w-3 mr-1" />
          {scoreChange} pts
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        No change
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Game Sessions</CardTitle>
          <CardDescription>Loading your game history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Game Sessions</CardTitle>
          <CardDescription>Your game session history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Game Sessions Yet</h3>
            <p className="text-gray-500">
              Start playing levels to see your game history here.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Game Sessions
        </CardTitle>
        <CardDescription>
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} played
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session, index) => {
            const performanceChange = getPerformanceChange(session, index)
            
            return (
              <div
                key={session.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {formatDate(session.createdAt)}
                        </span>
                      </div>
                      {index === 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Latest
                        </Badge>
                      )}
                      {performanceChange && performanceChange.scoreChange !== 0 && (
                        getPerformanceBadge(performanceChange.scoreChange)
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Score</div>
                        <div className="font-semibold">{session.score} pts</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Profit</div>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(Number(session.cumulativeProfit))}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Cash Flow</div>
                        <div className="font-semibold">
                          {formatCurrency(Number(session.cashFlow))}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Finished Goods</div>
                        <div className="font-semibold">{session.finishedGoodStock} units</div>
                      </div>
                    </div>
                    
                    {performanceChange && (
                      <div className="mt-3 text-sm text-gray-600">
                        {performanceChange.profitChange > 0 && (
                          <span className="text-green-600">
                            Profit improved by {formatCurrency(performanceChange.profitChange)}
                          </span>
                        )}
                        {performanceChange.profitChange < 0 && (
                          <span className="text-red-600">
                            Profit decreased by {formatCurrency(Math.abs(performanceChange.profitChange))}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {onViewDetails && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(session)}
                      className="ml-4"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
