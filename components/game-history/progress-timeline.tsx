"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Calendar, Target } from "lucide-react"
import { useMemo } from "react"

interface ProgressTimelineProps {
  readonly data: Array<{
    createdAt: Date
    score: number
    cumulativeProfit: number
    levelId: number
    levelName?: string
    attempt_number: number
  }>
  readonly levelId?: number
}

export function ProgressTimeline({ data, levelId }: ProgressTimelineProps) {
  const processedData = useMemo(() => {
    // Filter by level if specified, otherwise show all levels
    const filteredData = levelId 
      ? data.filter(entry => entry.levelId === levelId)
      : data

    // Sort by date
    return filteredData.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  }, [data, levelId])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("sv-SE", {
      month: "short",
      day: "numeric",
    }).format(new Date(date))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getProgressDirection = (current: number, previous: number) => {
    if (current > previous) return 'up'
    if (current < previous) return 'down'
    return 'same'
  }

  const maxScore = Math.max(...processedData.map(d => d.score))
  const maxProfit = Math.max(...processedData.map(d => Number(d.cumulativeProfit)))

  if (processedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Timeline
          </CardTitle>
          <CardDescription>Track your improvement over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Progress Data</h3>
            <p className="text-gray-500">
              Play some games to see your progress timeline.
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
          <TrendingUp className="h-5 w-5" />
          Progress Timeline
        </CardTitle>
        <CardDescription>
          {levelId ? `Level ${levelId} progression` : 'Overall progression across all levels'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {processedData.map((entry, index) => {
              const prevEntry = index > 0 ? processedData[index - 1] : null
              const scoreDirection = prevEntry ? getProgressDirection(entry.score, prevEntry.score) : 'same'
              const profitDirection = prevEntry ? getProgressDirection(Number(entry.cumulativeProfit), Number(prevEntry.cumulativeProfit)) : 'same'
              
              return (
                <div key={`${entry.levelId}-${entry.attempt_number}`} className="relative flex items-start gap-4 pb-6">
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 ${
                    index === processedData.length - 1 
                      ? 'bg-blue-100 border-blue-500 text-blue-700' 
                      : 'bg-white border-gray-300 text-gray-600'
                  }`}>
                    <span className="text-xs font-semibold">
                      {entry.attempt_number}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <time className="text-sm font-medium text-gray-900">
                        {formatDate(entry.createdAt)}
                      </time>
                      {!levelId && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {entry.levelName || `Level ${entry.levelId}`}
                        </span>
                      )}
                      {index === processedData.length - 1 && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          Latest
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Score</span>
                          {prevEntry && scoreDirection !== 'same' && (
                            <span className={`text-xs ${
                              scoreDirection === 'up' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {scoreDirection === 'up' ? '↗' : '↘'} 
                              {Math.abs(entry.score - prevEntry.score)}
                            </span>
                          )}
                        </div>
                        <div className="text-lg font-semibold">
                          {entry.score} pts
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${(entry.score / maxScore) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Profit</span>
                          {prevEntry && profitDirection !== 'same' && (
                            <span className={`text-xs ${
                              profitDirection === 'up' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {profitDirection === 'up' ? '↗' : '↘'} 
                              {formatCurrency(Math.abs(Number(entry.cumulativeProfit) - Number(prevEntry.cumulativeProfit)))}
                            </span>
                          )}
                        </div>
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(Number(entry.cumulativeProfit))}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${(Number(entry.cumulativeProfit) / maxProfit) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Summary Stats */}
          {processedData.length > 1 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Overall Progress</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Score Improvement</div>
                  <div className="font-semibold">
                    {processedData[processedData.length - 1].score - processedData[0].score > 0 ? '+' : ''}
                    {processedData[processedData.length - 1].score - processedData[0].score} pts
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Profit Improvement</div>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(
                      Number(processedData[processedData.length - 1].cumulativeProfit) - 
                      Number(processedData[0].cumulativeProfit)
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
