"use client"

import { useState, useEffect, useRef } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createPortal } from "react-dom"
import type { TutorialOverlayProps, TutorialStep } from "@/types/components"

function getLevelTutorialSteps(levelId: number): TutorialStep[] {
  if (levelId !== 0) return []

  return [
    {
      title: "Welcome to Level 0!",
      description:
        "Let's take a tour of your supply chain management interface. This tutorial will guide you through all the key elements you'll need to succeed.",
      targetSelector: "[data-tutorial='game-header']",
      position: "bottom" as const,
    },
    {
      title: "Status Bar",
      description:
        "This shows your current day, available cash, and inventory levels. Keep an eye on your cash flow and ingredient supplies!",
      targetSelector: "[data-tutorial='status-bar']",
      position: "bottom" as const,
    },
    {
      title: "Supply Chain Map",
      description:
        "This is your main workspace! Click on suppliers (left) to purchase ingredients, the factory (center) to set production, and restaurants (right) to fulfill orders.",
      targetSelector: "[data-tutorial='supply-chain-map']",
      position: "bottom" as const,
    },
    {
      title: "Quick Actions",
      description:
        "This widget shows current material prices and pending orders. Use it to quickly check supplier prices and delivery schedules.",
      targetSelector: "[data-tutorial='quick-actions']",
      position: "right" as const,
    },
    {
      title: "Market Information",
      description:
        "Here you can see customer requirements, delivery schedules, and pricing information. Plan your production and deliveries accordingly!",
      targetSelector: "[data-tutorial='market-info']",
      position: "left" as const,
    },
    {
      title: "Daily Order Summary",
      description:
        "This section summarizes all your planned actions for today - purchases, production, and sales. Review everything before proceeding to the next day.",
      targetSelector: "[data-tutorial='daily-summary']",
      position: "top" as const,
    },
    {
      title: "Inventory Chart",
      description:
        "Track your ingredient levels over time. Make sure you don't run out of materials needed for production!",
      targetSelector: "[data-tutorial='inventory-chart']",
      position: "top" as const,
    },
    {
      title: "Cash Flow Chart",
      description:
        "Monitor your financial performance. The goal is to maintain positive cash flow and reach the profit target!",
      targetSelector: "[data-tutorial='cashflow-chart']",
      position: "top" as const,
    },
    {
      title: "Cost Summary & Next Day",
      description:
        "Review your total costs and revenue before advancing. The 'Next Day' button processes all your decisions and moves the game forward.",
      targetSelector: "[data-tutorial='cost-summary']",
      position: "top" as const,
    },
    {
      title: "Game History",
      description:
        "View detailed results from previous days. Use this data to analyze your performance and improve your strategy.",
      targetSelector: "[data-tutorial='game-history']",
      position: "top" as const,
    },
    {
      title: "Ready to Start!",
      description:
        "You're now ready to begin! Remember: buy ingredients from suppliers, produce meals at the factory, and deliver to restaurants. Good luck!",
      targetSelector: "[data-tutorial='supply-chain-map']",
      position: "center" as const,
    },
  ]
}


export function TutorialOverlay({ steps, onComplete, isOpen, onTabChange, levelId }: TutorialOverlayProps) {
  // Use level-specific steps if no steps provided and levelId is available
  const tutorialSteps = steps || (levelId !== undefined ? getLevelTutorialSteps(levelId) : [])

  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)
  const highlightedElementRef = useRef<Element | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize portal container
  useEffect(() => {
    if (typeof document !== "undefined") {
      setPortalContainer(document.body)
    }
  }, [])

  // Function to highlight the current step's element
  useEffect(() => {
    if (!isOpen || !tutorialSteps[currentStep]) return

    const findAndHighlightElement = (retryCount = 0) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      // Remove highlight from previous element only if it's different
      const targetSelector = tutorialSteps[currentStep].targetSelector
      const targetElement = document.querySelector(targetSelector)

      if (highlightedElementRef.current && highlightedElementRef.current !== targetElement) {
        highlightedElementRef.current.classList.remove("tutorial-highlight")
        highlightedElementRef.current = null
      }

      // Activate the appropriate tab if specified
      const currentTabToActivate = tutorialSteps[currentStep].tabToActivate
      if (currentTabToActivate && onTabChange) {
        onTabChange(currentTabToActivate)
      }

      if (targetElement) {
        // Only add highlight if not already highlighted
        if (!targetElement.classList.contains("tutorial-highlight")) {
          targetElement.classList.add("tutorial-highlight")
          highlightedElementRef.current = targetElement
        }

        // Position the tooltip
        const rect = targetElement.getBoundingClientRect()
        const step = tutorialSteps[currentStep]
        const tooltipWidth = 320
        const tooltipHeight = 200

        let top = 0
        let left = 0

        switch (step.position) {
          case "top":
            top = rect.top - tooltipHeight - 20 + window.scrollY
            left = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX
            break
          case "right":
            top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY
            left = rect.right + 20 + window.scrollX
            break
          case "bottom":
            top = rect.bottom + 20 + window.scrollY
            left = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX
            break
          case "left":
            top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY
            left = rect.left - tooltipWidth - 20 + window.scrollX
            break
          case "center":
            top = window.innerHeight / 2 - tooltipHeight / 2 + window.scrollY
            left = window.innerWidth / 2 - tooltipWidth / 2 + window.scrollX
            break
        }

        // Ensure tooltip stays within viewport
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        if (left < 20) left = 20
        if (left + tooltipWidth > viewportWidth - 20) left = viewportWidth - tooltipWidth - 20
        if (top < 20) top = 20
        if (top + tooltipHeight > viewportHeight - 20) top = viewportHeight - tooltipHeight - 20

        setTooltipPosition({ top, left })

        // Scroll element into view if needed
        if (rect.top < 100 || rect.bottom > window.innerHeight - 100) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          })
        }
      } else if (retryCount < 10) {
        // Retry after a short delay if element not found (up to 10 times)
        timeoutRef.current = setTimeout(() => findAndHighlightElement(retryCount + 1), 100 * (retryCount + 1))
      } else {
        console.warn(`Tutorial target element not found after 10 attempts: ${targetSelector}`)
        // Fallback to center position if element not found
        setTooltipPosition({
          top: window.innerHeight / 2 - 100 + window.scrollY,
          left: window.innerWidth / 2 - 160 + window.scrollX,
        })
      }
    }

    // Start the search with a small initial delay
    timeoutRef.current = setTimeout(() => findAndHighlightElement(), 200)

    // Cleanup function - only clear timeout, don't remove highlight here
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [currentStep, isOpen, tutorialSteps, onTabChange])

  // Cleanup effect for when tutorial closes
  useEffect(() => {
    return () => {
      // Clean up when component unmounts or tutorial closes
      if (highlightedElementRef.current) {
        highlightedElementRef.current.classList.remove("tutorial-highlight")
        highlightedElementRef.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isOpen])

  // Handle next step
  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Handle tutorial completion
  const handleComplete = () => {
    // Remove highlight from the last element
    if (highlightedElementRef.current) {
      highlightedElementRef.current.classList.remove("tutorial-highlight")
      highlightedElementRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setCurrentStep(0)
    onComplete()
  }

  if (!isOpen || !portalContainer || tutorialSteps.length === 0) return null

  // Add a global style for the tutorial highlight
  const tutorialStyle = `
    .tutorial-highlight {
      position: relative !important;
      z-index: 999 !important;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.8) !important;
      border-radius: 8px !important;
      background-color: rgba(59, 130, 246, 0.1) !important;
      transition: none !important;
    }
    .tutorial-tooltip {
      z-index: 1000 !important;
      position: fixed !important;
      width: 320px;
      pointer-events: auto !important;
    }
    .tutorial-backdrop {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background-color: rgba(0, 0, 0, 0.5) !important;
      z-index: 998 !important;
      pointer-events: none !important;
    }
  `

  return createPortal(
    <>
      {/* Add global styles */}
      <style>{tutorialStyle}</style>

      {/* Backdrop */}
      <div className="tutorial-backdrop" />

      {/* Tooltip */}
      <div
        className="tutorial-tooltip"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        <Card className="p-4 shadow-xl border-blue-300 bg-white">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-gray-900">{tutorialSteps[currentStep]?.title}</h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleComplete}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <p className="text-sm mb-4 text-gray-700">{tutorialSteps[currentStep]?.description}</p>
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {tutorialSteps.length}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {currentStep < tutorialSteps.length - 1 ? "Next" : "Finish"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>,
    portalContainer,
  )
}
