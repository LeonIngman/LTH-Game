import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DailyProgressProps {
    readonly dailyData: any[]
    readonly isLoading?: boolean
}

export function DailyProgress({ dailyData, isLoading = false }: DailyProgressProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("sv-SE", {
            style: "currency",
            currency: "SEK",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Daily Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Loading current game progress...</p>
                </CardContent>
            </Card>
        )
    }

    if (!dailyData || dailyData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Daily Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No game progress yet. Start playing to see your daily performance.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Daily Progress</CardTitle>
                <p className="text-sm text-muted-foreground">Track your daily performance</p>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-2">Day</th>
                                <th className="text-right p-2">Cash</th>
                                <th className="text-right p-2">Revenue</th>
                                <th className="text-right p-2">Costs</th>
                                <th className="text-right p-2">Profit</th>
                                <th className="text-right p-2">Cum. Profit</th>
                                <th className="text-right p-2">Production</th>
                                <th className="text-right p-2">Sales</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailyData.map((day) => {
                                // Handle different data formats
                                const totalCosts = day.totalCosts || day.costs?.total || 0
                                const revenue = day.revenue || 0
                                const profit = day.profit || (revenue - totalCosts)
                                const cumulativeProfit = day.cumulativeProfit || 0
                                const production = day.production || 0
                                const sales = day.sales || 0
                                const cash = day.cash || 0

                                return (
                                    <tr key={day.day} className="border-b hover:bg-muted/50">
                                        <td className="p-2 font-medium">{day.day}</td>
                                        <td className="p-2 text-right">{formatCurrency(cash)}</td>
                                        <td className="p-2 text-right">{formatCurrency(revenue)}</td>
                                        <td className="p-2 text-right">{formatCurrency(totalCosts)}</td>
                                        <td className={`p-2 text-right ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(profit)}
                                        </td>
                                        <td className={`p-2 text-right font-medium ${cumulativeProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(cumulativeProfit)}
                                        </td>
                                        <td className="p-2 text-right">{production}</td>
                                        <td className="p-2 text-right">{sales}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
