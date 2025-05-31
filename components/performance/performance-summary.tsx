import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface PerformanceSummaryProps {
  levelName: string
  maxScore: number
  currentScore: number
  profit: number
  username?: string
}

export function PerformanceSummary({ levelName, maxScore, currentScore, profit, username }: PerformanceSummaryProps) {
  const scorePercentage = Math.min(Math.round((currentScore / maxScore) * 100), 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{username ? `${username}'s Performance Summary` : "Your Performance Summary"}</CardTitle>
        <CardDescription>Level: {levelName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Score</div>
            <div className="text-sm font-medium">
              {currentScore} / {maxScore}
            </div>
          </div>
          <Progress value={scorePercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Total Profit</div>
            <div className="text-2xl font-bold">${profit.toFixed(2)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Completion</div>
            <div className="text-2xl font-bold">{scorePercentage}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
