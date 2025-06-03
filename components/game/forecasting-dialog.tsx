"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, Clock, Target, ArrowRight, Factory, AlertTriangle } from "lucide-react"
import type { ForecastingDialogProps } from "@/types/components"


export function ForecastingDialog({ isOpen, onComplete, levelId }: ForecastingDialogProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [forecasts, setForecasts] = useState<Record<string, number>>({})
  const [currentForecast, setCurrentForecast] = useState<string>("")
  const [productionRates, setProductionRates] = useState<Record<number, number>>({})

  // Historical data for Yummy Zone (Step 1) - different for each level
  const getYummyZoneData = () => {
    if (levelId === 3) {
      return [
        { period: "t-5", demand: 68, description: "5 periods ago" },
        { period: "t-4", demand: 104, description: "4 periods ago" },
        { period: "t-3", demand: 74, description: "3 periods ago" },
        { period: "t-2", demand: null, description: "2 periods ago (calculate this)" },
        { period: "t-1", demand: 84, description: "1 period ago" },
      ]
    }
    // Default data for other levels (Level 2)
    return [
      { period: "t-5", demand: 55, description: "5 periods ago" },
      { period: "t-4", demand: 39, description: "4 periods ago" },
      { period: "t-3", demand: 74, description: "3 periods ago" },
      { period: "t-2", demand: null, description: "2 periods ago (calculate this)" },
      { period: "t-1", demand: 50, description: "1 period ago" },
    ]
  }

  // Toast-to-go data for exponential smoothing - different for each level
  const getToastToGoData = () => {
    if (levelId === 3) {
      return {
        forecast: 105,
        actualDemand: 80,
      }
    }
    // Default data for other levels (Level 2)
    return {
      forecast: 125,
      actualDemand: 100,
    }
  }

  // StudyFuel data for simple forecasting - different for each level
  const getStudyFuelData = () => {
    if (levelId === 3) {
      return {
        forecastError: 40,
        actualDemand: 140,
      }
    }
    // Default data for other levels (Level 2)
    return {
      forecastError: -10,
      actualDemand: 150,
    }
  }

  const yummyZoneData = getYummyZoneData()
  const toastToGoData = getToastToGoData()
  const studyFuelData = getStudyFuelData()

  // Initialize production rates with 0 for all days when component mounts or step 4 is reached
  useEffect(() => {
    if (currentStep === 4 && Object.keys(productionRates).length === 0) {
      const initialRates: Record<number, number> = {}
      for (let i = 0; i <= 20; i++) {
        initialRates[i] = 0
      }
      setProductionRates(initialRates)
    }
  }, [currentStep, productionRates])

  const handleForecastChange = useCallback((value: string) => {
    setCurrentForecast(value)
  }, [])

  const handleProductionRateChange = useCallback((day: number, value: string) => {
    const rate = Number.parseInt(value, 10)
    if (!isNaN(rate) && rate >= 0) {
      setProductionRates((prev) => ({
        ...prev,
        [day]: rate,
      }))
    }
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep === 4) {
      // For step 4, production rates are always valid since they're pre-filled
      const updatedForecasts = {
        ...forecasts,
        productionRates: productionRates,
      }
      setForecasts(updatedForecasts)

      if (currentStep < 5) {
        setCurrentStep(currentStep + 1)
        setCurrentForecast("")
      } else {
        onComplete(updatedForecasts)
      }
      return
    }

    const forecastValue = Number.parseInt(currentForecast, 10)
    if (isNaN(forecastValue) || forecastValue <= 0) {
      return
    }

    // Store the forecast for the current customer
    let customerKey = ""
    if (currentStep === 1) customerKey = "yummy-zone"
    if (currentStep === 2) customerKey = "toast-to-go"
    if (currentStep === 3) customerKey = "study-fuel"

    const updatedForecasts = {
      ...forecasts,
      [customerKey]: forecastValue,
    }
    setForecasts(updatedForecasts)

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
      setCurrentForecast("")
    } else {
      // Complete forecasting
      onComplete(updatedForecasts)
    }
  }, [currentForecast, forecasts, currentStep, productionRates, onComplete])

  const isValidForecast = () => {
    if (currentStep === 4) {
      // For step 4, always valid since fields are pre-filled
      return true
    }

    const value = Number.parseInt(currentForecast, 10)
    return !isNaN(value) && value > 0
  }

  // Calculate total forecast
  const getTotalForecast = () => {
    const yummyZone = forecasts["yummy-zone"] || 0
    const toastToGo = forecasts["toast-to-go"] || 0
    const studyFuel = forecasts["study-fuel"] || 0
    return yummyZone + toastToGo + studyFuel
  }

  // Step 1: Yummy Zone - Moving Average
  if (currentStep === 1) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">Demand Forecasting - Yummy Zone</DialogTitle>
              <Badge variant="outline" className="text-sm">
                Step {currentStep} of 5
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Moving Average Forecasting (3 Periods)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  You will be using the <strong>Moving Average method for 3 periods</strong> to forecast demand for your
                  customers.
                </p>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    <strong>Important:</strong> Each period corresponds to 20 days, and period t is the coming period of
                    this level.
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Historical Data */}
            <Card>
              <CardHeader>
                <CardTitle>Historical Demand Data - Yummy Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Period</th>
                        <th className="text-left p-3 font-semibold">Demand (meals)</th>
                        <th className="text-left p-3 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yummyZoneData.map((row, index) => (
                        <tr key={row.period} className={`border-b ${row.demand === null ? "bg-yellow-50" : ""}`}>
                          <td className="p-3 font-mono">{row.period}</td>
                          <td className="p-3">
                            {row.demand !== null ? (
                              <span className="font-semibold">{row.demand}</span>
                            ) : (
                              <span className="text-orange-600 font-semibold">Calculate this!</span>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground">{row.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> The demand at time t-2 was equal to the forecast for that period using the
                    moving average method.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Forecast Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Your Forecast
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Calculate your forecast for period <strong>t</strong> (the current level period) using the moving
                  average method.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="forecast">Your forecast for period t (meals):</Label>
                  <Input
                    id="forecast"
                    type="number"
                    min="1"
                    value={currentForecast}
                    onChange={(e) => handleForecastChange(e.target.value)}
                    placeholder="Enter your forecast..."
                    className="max-w-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-end">
              <Button onClick={handleNext} disabled={!isValidForecast()} className="min-w-24">
                Next
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Step 2: Toast-to-go - Exponential Smoothing
  if (currentStep === 2) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">Demand Forecasting - Toast-to-go</DialogTitle>
              <Badge variant="outline" className="text-sm">
                Step {currentStep} of 5
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Exponential Smoothing (α = 0.2)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  You will be using <strong>Exponential Smoothing with alpha (α) = 0.2</strong> to forecast demand for
                  Toast-to-go.
                </p>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    <strong>Important:</strong> Each period corresponds to 20 days, and period t is the coming period of
                    this level.
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Exponential Smoothing Data */}
            <Card>
              <CardHeader>
                <CardTitle>Exponential Smoothing Data - Toast-to-go</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Period</th>
                        <th className="text-left p-3 font-semibold">Forecast (meals)</th>
                        <th className="text-left p-3 font-semibold">Actual Demand (meals)</th>
                        <th className="text-left p-3 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3 font-mono">t-1</td>
                        <td className="p-3 font-semibold">{toastToGoData.forecast}</td>
                        <td className="p-3 font-semibold">{toastToGoData.actualDemand}</td>
                        <td className="p-3 text-muted-foreground">Previous period</td>
                      </tr>
                      <tr className="border-b bg-yellow-50">
                        <td className="p-3 font-mono">t</td>
                        <td className="p-3">
                          <span className="text-orange-600 font-semibold">Calculate this!</span>
                        </td>
                        <td className="p-3 text-muted-foreground">Unknown (future)</td>
                        <td className="p-3 text-muted-foreground">Current period (your forecast)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Forecast Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Your Forecast
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Calculate your forecast for period <strong>t</strong> (the current level period) using exponential
                  smoothing with the given parameters.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="forecast">Your forecast for period t (meals):</Label>
                  <Input
                    id="forecast"
                    type="number"
                    min="1"
                    value={currentForecast}
                    onChange={(e) => handleForecastChange(e.target.value)}
                    placeholder="Enter your forecast..."
                    className="max-w-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-end">
              <Button onClick={handleNext} disabled={!isValidForecast()} className="min-w-24">
                Next
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Step 3: StudyFuel - Simple Forecasting
  if (currentStep === 3) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">Demand Forecasting - StudyFuel</DialogTitle>
              <Badge variant="outline" className="text-sm">
                Step {currentStep} of 5
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" />
                  Simple Forecasting
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  You will be using <strong>Simple Forecasting</strong> where the current period forecast is equal to
                  the last period's forecast.
                </p>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    <strong>Important:</strong> Each period corresponds to 20 days, and period t is the coming period of
                    this level.
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Simple Forecasting Data */}
            <Card>
              <CardHeader>
                <CardTitle>Simple Forecasting Data - StudyFuel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Period</th>
                        <th className="text-left p-3 font-semibold">Forecast Error</th>
                        <th className="text-left p-3 font-semibold">Actual Demand (meals)</th>
                        <th className="text-left p-3 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3 font-mono">t-1</td>
                        <td className="p-3 font-semibold">{studyFuelData.forecastError}</td>
                        <td className="p-3 font-semibold">{studyFuelData.actualDemand}</td>
                        <td className="p-3 text-muted-foreground">Previous period</td>
                      </tr>
                      <tr className="border-b bg-yellow-50">
                        <td className="p-3 font-mono">t</td>
                        <td className="p-3 text-muted-foreground">Unknown (future)</td>
                        <td className="p-3 text-muted-foreground">Unknown (future)</td>
                        <td className="p-3">
                          <span className="text-orange-600 font-semibold">Calculate forecast!</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Forecast Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Your Forecast
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Calculate your forecast for period <strong>t</strong> (the current level period) using simple
                  forecasting method.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="forecast">Your forecast for period t (meals):</Label>
                  <Input
                    id="forecast"
                    type="number"
                    min="1"
                    value={currentForecast}
                    onChange={(e) => handleForecastChange(e.target.value)}
                    placeholder="Enter your forecast..."
                    className="max-w-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-end">
              <Button onClick={handleNext} disabled={!isValidForecast()} className="min-w-24">
                Next
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Step 4: Production Planning
  if (currentStep === 4) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">Production Planning</DialogTitle>
              <Badge variant="outline" className="text-sm">
                Step {currentStep} of 5
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Forecast Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Your Demand Forecasts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Customer</th>
                        <th className="text-left p-3 font-semibold">Forecasting Method</th>
                        <th className="text-right p-3 font-semibold">Forecast (meals)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">Yummy Zone</td>
                        <td className="p-3 text-muted-foreground">Moving Average (3 periods)</td>
                        <td className="p-3 text-right font-semibold">{forecasts["yummy-zone"] || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Toast-to-go</td>
                        <td className="p-3 text-muted-foreground">Exponential Smoothing (α=0.2)</td>
                        <td className="p-3 text-right font-semibold">{forecasts["toast-to-go"] || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">StudyFuel</td>
                        <td className="p-3 text-muted-foreground">Simple Forecasting</td>
                        <td className="p-3 text-right font-semibold">{forecasts["study-fuel"] || 0}</td>
                      </tr>
                      <tr className="border-t-2 border-gray-300 bg-blue-50">
                        <td className="p-3 font-semibold">Total Demand</td>
                        <td className="p-3"></td>
                        <td className="p-3 text-right font-bold text-lg">{getTotalForecast()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Production Planning Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-5 w-5" />
                  Production Planning Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Based on your saved forecasts, you can specify your <strong>daily production rate</strong> for each
                  day of the level. The fields are pre-filled with 0, but you can adjust them as needed.
                </p>
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">
                    <strong>Warning:</strong> Once you proceed, your production rates cannot be changed during the rest
                    of this level!
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Production Rate Planning */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Production Rates (meals per day)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-3">
                  {Array.from({ length: 20 }, (_, i) => {
                    const day = i + 1 // go from 1 to 20
                    return (
                    <div key={day} className="space-y-1">
                      <Label htmlFor={`day-${day}`} className="text-xs font-medium">
                        Day {day}
                      </Label>
                      <Input
                        id={`day-${day}`}
                        type="number"
                        min="0"
                        value={productionRates[day] || 0}
                        onChange={(e) => handleProductionRateChange(day, e.target.value)}
                        className="text-center text-sm"
                      />
                    </div>
                    )
                  })}
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    <strong>Total planned production:</strong>{" "}
                    {Object.values(productionRates).reduce((sum, rate) => sum + (rate || 0), 0)} meals
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Total forecasted demand:</strong> {getTotalForecast()} meals
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-end">
              <Button onClick={handleNext} disabled={!isValidForecast()} className="min-w-24">
                Next
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Step 5: Forecasting Error Analysis
  if (currentStep === 5) {
    // Sample actual demand data (this would come from the game engine in a real implementation)
    const actualDemandData = {
      "yummy-zone": 62,
      "toast-to-go": 118,
      "study-fuel": 160,
    }

    const calculateForecastError = (actual: number, forecast: number) => actual - forecast
    const calculateAbsoluteForecastError = (actual: number, forecast: number) => Math.abs(actual - forecast)

    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">Forecasting Error Analysis</DialogTitle>
              <Badge variant="outline" className="text-sm">
                Step {currentStep} of 5
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Forecast vs Actual Demand Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Now that the period has ended, let's analyze how accurate your forecasts were compared to the actual
                  demand.
                </p>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    <strong>Note:</strong> Forecast Error = Actual Demand - Forecast
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Forecast Error Analysis Table */}
            <Card>
              <CardHeader>
                <CardTitle>Forecast Error Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Customer</th>
                        <th className="text-right p-3 font-semibold">Forecasted Demand</th>
                        <th className="text-right p-3 font-semibold">Actual Demand</th>
                        <th className="text-right p-3 font-semibold">Forecast Error</th>
                        <th className="text-right p-3 font-semibold">Absolute Forecast Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">Yummy Zone</td>
                        <td className="p-3 text-right font-semibold">{forecasts["yummy-zone"] || 0}</td>
                        <td className="p-3 text-right font-semibold">{actualDemandData["yummy-zone"]}</td>
                        <td className="p-3 text-right font-semibold">
                          {calculateForecastError(actualDemandData["yummy-zone"], forecasts["yummy-zone"] || 0)}
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {calculateAbsoluteForecastError(actualDemandData["yummy-zone"], forecasts["yummy-zone"] || 0)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Toast-to-go</td>
                        <td className="p-3 text-right font-semibold">{forecasts["toast-to-go"] || 0}</td>
                        <td className="p-3 text-right font-semibold">{actualDemandData["toast-to-go"]}</td>
                        <td className="p-3 text-right font-semibold">
                          {calculateForecastError(actualDemandData["toast-to-go"], forecasts["toast-to-go"] || 0)}
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {calculateAbsoluteForecastError(
                            actualDemandData["toast-to-go"],
                            forecasts["toast-to-go"] || 0,
                          )}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">StudyFuel</td>
                        <td className="p-3 text-right font-semibold">{forecasts["study-fuel"] || 0}</td>
                        <td className="p-3 text-right font-semibold">{actualDemandData["study-fuel"]}</td>
                        <td className="p-3 text-right font-semibold">
                          {calculateForecastError(actualDemandData["study-fuel"], forecasts["study-fuel"] || 0)}
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {calculateAbsoluteForecastError(actualDemandData["study-fuel"], forecasts["study-fuel"] || 0)}
                        </td>
                      </tr>
                      <tr className="border-t-2 border-gray-300 bg-blue-50">
                        <td className="p-3 font-semibold">Total</td>
                        <td className="p-3 text-right font-bold">
                          {(forecasts["yummy-zone"] || 0) +
                            (forecasts["toast-to-go"] || 0) +
                            (forecasts["study-fuel"] || 0)}
                        </td>
                        <td className="p-3 text-right font-bold">
                          {actualDemandData["yummy-zone"] +
                            actualDemandData["toast-to-go"] +
                            actualDemandData["study-fuel"]}
                        </td>
                        <td className="p-3 text-right font-bold">
                          {calculateForecastError(
                            actualDemandData["yummy-zone"] +
                              actualDemandData["toast-to-go"] +
                              actualDemandData["study-fuel"],
                            (forecasts["yummy-zone"] || 0) +
                              (forecasts["toast-to-go"] || 0) +
                              (forecasts["study-fuel"] || 0),
                          )}
                        </td>
                        <td className="p-3 text-right font-bold">
                          {calculateAbsoluteForecastError(
                            actualDemandData["yummy-zone"] +
                              actualDemandData["toast-to-go"] +
                              actualDemandData["study-fuel"],
                            (forecasts["yummy-zone"] || 0) +
                              (forecasts["toast-to-go"] || 0) +
                              (forecasts["study-fuel"] || 0),
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Question */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Reflection Question
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <p className="font-medium text-yellow-800">
                    What indications do you get from the forecast error compared to the absolute forecast error?
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Consider this question as you proceed with the level. Think about what positive and negative forecast
                  errors tell you about your forecasting accuracy and bias.
                </p>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-end">
              <Button onClick={() => onComplete(forecasts)} className="min-w-32 bg-green-600 hover:bg-green-700">
                Start Level
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Placeholder for other steps (to be implemented)
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Forecasting Step {currentStep}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>Step {currentStep} content will be implemented next...</p>
          <Button onClick={() => onComplete(forecasts)}>Complete Forecasting (Temporary)</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
