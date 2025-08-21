import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatUsernameAsGroup } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"

interface PerformanceSummaryProps {
  levelName: string
  maxScore: number
  currentScore: number
  profit: number
  username?: string
  userId?: string
}

export function PerformanceSummary({ levelName, maxScore, currentScore, profit, username, userId }: Readonly<PerformanceSummaryProps>) {
  const { translations } = useTranslation()
  const scorePercentage = Math.min(Math.round((currentScore / maxScore) * 100), 100)
  const displayName = username ? formatUsernameAsGroup(username, userId) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {displayName 
            ? `${displayName}'s ${translations.performance.performanceSummary}` 
            : translations.performance.yourPerformanceSummary
          }
        </CardTitle>
        <CardDescription>{translations.performance.level}: {levelName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{translations.performance.score}</div>
            <div className="text-sm font-medium">
              {currentScore} / {maxScore}
            </div>
          </div>
          <Progress value={scorePercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">{translations.performance.totalProfit}</div>
            <div className="text-2xl font-bold">
              {typeof profit === "number" && !isNaN(profit)
                ? new Intl.NumberFormat("sv-SE", {
                  style: "currency",
                  currency: "SEK",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(profit)
                : "—"}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">{translations.performance.completion}</div>
            <div className="text-2xl font-bold">{scorePercentage}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
