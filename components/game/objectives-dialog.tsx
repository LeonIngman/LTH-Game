"use client"

import { Target, BookOpen, TrendingUp, Dices, Award } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface ObjectivesDialogProps {
  isOpen: boolean
  onClose: () => void
  levelId: number
}

export function ObjectivesDialog({ isOpen, onClose, levelId }: ObjectivesDialogProps) {
  const getLevelTitle = () => {
    switch (levelId) {
      case 0:
        return "The First Spark"
      case 1:
        return "Timing is Everything"
      case 2:
        return "Forecast the Future"
      case 3:
        return "Uncertainty Unleashed"
      default:
        return "Burger Restaurant Game"
    }
  }

  const getLevelBackground = () => {
    switch (levelId) {
      case 0:
        return "You've just founded your startup, a bold new venture in the frozen burger business. No fancy factory. No complex logistics. Just you, a recipe, and a blank canvas.\n\nFor now, everything is perfect: suppliers deliver instantly, customers get their orders at once, and there is no risk in sight. It's not the real world, but it's the best place to learn the ropes. This is your training ground. Explore freely, make bold choices, and master the fundamentals of supply chain before things get real. Let's build your legacy, one burger at a time."
      case 1:
        return "Your business has launched, and suddenly, the real world kicks in. Ingredients take days to arrive. Customers don't wait forever. You're no longer in a sandbox. This is the first test of your planning instincts.\n\nLead times are now part of your daily life. Can you think ahead and keep your customers satisfied? Or will delays catch you off guard? Welcome to the rhythm of real supply chains. Let's see if you can dance to the beat."
      case 2:
        return "The past holds the key to your future. You've gathered enough data to predict demand, but planning isn't just about numbers, it's about foresight. The market is steady... for now. Your job: analyze trends, forecast orders, and align your supply chain like a seasoned strategist. Get it right, and you'll glide through the days with no waste and no shortage. Get it wrong, and the cracks will show. This is your first true strategic challenge. Trust your data, and your instincts."
      case 3:
        return "The calm is over. Reality just got messier. One of your suppliers is struggling - shipping times fluctuate. One of your customers is unpredictable - their delivery times are all over the place, some are delayed, the others are fast. Welcome to uncertainty. Your forecasts are still valid, but now, every day brings surprises. Can your supply chain absorb the shock? Can you adapt in time? This is where great businesses earn their edge: not in perfection, but in flexibility. Let's see how you manage chaos."
      default:
        return "Test your restaurant management skills in this simulation game."
    }
  }

  const getLevelObjectives = () => {
    switch (levelId) {
      case 0:
        return ["Get to the Profit Threshold: 3800 kr"]
      case 1:
        return ["Get to the Profit Threshold: 3800 kr"]
      case 2:
        return ["Get to the Profit Threshold: 3800 kr"]
      case 3:
        return ["Get to the Profit Threshold: 3800 kr"]
      default:
        return ["Complete the level with a positive cash balance"]
    }
  }

  const getLevelDecisions = () => {
    switch (levelId) {
      case 0:
        return ["Daily production rate", "Quantity purchased per supplier per component", "Quantity sold per customer"]
      case 1:
        return ["Daily production rate", "Quantity purchased per supplier per component", "Quantity sold per customer"]
      case 2:
        return [
          "Demand Forecast",
          "Daily production rate",
          "Quantity purchased per supplier per component",
          "Quantity sold per customer",
        ]
      case 3:
        return [
          "Demand forecast",
          "Daily production rate",
          "Quantity purchased per supplier per component",
          "Quantity sold per customer",
        ]
      default:
        return []
    }
  }

  const getKeyMetrics = () => {
    switch (levelId) {
      case 0:
        return ["Inventory Turnover", "Inventory Level", "Profit", "Cost breakdown"]
      case 1:
        return [
          "Inventory Turnover",
          "Inventory Level",
          "Profit",
          "Cost breakdown",
          "Customer Satisfaction",
          "Lead time",
        ]
      case 2:
        return [
          "Inventory Turnover",
          "Inventory Level",
          "Profit",
          "Cost breakdown",
          "Customer Satisfaction",
          "Lead time",
          "Forecast error",
        ]
      case 3:
        return [
          "Inventory turnover",
          "Inventory level",
          "Profit",
          "Cost breakdown",
          "Customer satisfaction",
          "Lead time",
          "Forecast error",
        ]
      default:
        return ["Cash balance", "Inventory levels", "Customer satisfaction"]
    }
  }

  const getLevelOutcomes = () => {
    switch (levelId) {
      case 0:
        return ["Understand the interface", "Define production rates", "Place orders", "Deliver to customers"]
      case 1:
        return [
          "Manage upstream and downstream lead times for the first time and begin thinking like a supply chain planner.",
        ]
      case 2:
        return ["Analyze demand data and predict customer needs while maintaining production and delivery efficiency."]
      case 3:
        return ["Navigate random fluctuations in delivery and lead times to maintain customer satisfaction."]
      default:
        return []
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5" />
            Level {levelId}: {getLevelTitle()}
          </DialogTitle>
          <DialogDescription>Background information and objectives for this level</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4" /> Background
            </h3>
            <p className="text-muted-foreground whitespace-pre-line">{getLevelBackground()}</p>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium flex items-center gap-2 mb-2">
              <Target className="h-4 w-4" /> Objectives
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              {getLevelObjectives().map((objective, index) => (
                <li key={index} className="text-muted-foreground">
                  {objective}
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium flex items-center gap-2 mb-2">
              <Dices className="h-4 w-4" /> Decisions
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              {getLevelDecisions().map((decision, index) => (
                <li key={index} className="text-muted-foreground">
                  {decision}
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4" /> Key Metrics to Track
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              {getKeyMetrics().map((metric, index) => (
                <li key={index} className="text-muted-foreground">
                  {metric}
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium flex items-center gap-2 mb-2">
              <Award className="h-4 w-4" /> Level Outcomes
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              {getLevelOutcomes().map((outcome, index) => (
                <li key={index} className="text-muted-foreground">
                  {outcome}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end">
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
