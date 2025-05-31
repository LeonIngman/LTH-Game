"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createPortal } from "react-dom"

interface TutorialStep {
  title: string
  description: string
  targetSelector: string
  position: "top" | "right" | "bottom" | "left" | "center"
  tabToActivate?: string // New property to indicate which tab should be active
}

interface TutorialOverlayProps {
  steps: TutorialStep[]
  onComplete: () => void
  isOpen: boolean
  onTabChange?: (tabId: string) => void // New callback to change tabs
}

export function TutorialOverlay({ steps, onComplete, isOpen, onTabChange }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null)

  // Initialize portal container
  useEffect(() => {
    if (typeof document !== "undefined") {
      setPortalContainer(document.body)
    }
  }, [])

  // Function to highlight the current step's element
  useEffect(() => {
    if (!isOpen || !steps[currentStep]) return

    // Remove highlight from previous element
    if (highlightedElement) {
      highlightedElement.classList.remove("tutorial-highlight")
    }

    // Activate the appropriate tab if specified
    const currentTabToActivate = steps[currentStep].tabToActivate
    if (currentTabToActivate && onTabChange) {
      onTabChange(currentTabToActivate)
    }

    // Find and highlight the new element
    const targetElement = document.querySelector(steps[currentStep].targetSelector)
    if (targetElement) {
      targetElement.classList.add("tutorial-highlight")
      setHighlightedElement(targetElement)

      // Position the tooltip
      const rect = targetElement.getBoundingClientRect()
      const step = steps[currentStep]
      const tooltipWidth = 320 // Approximate width of tooltip
      const tooltipHeight = 200 // Approximate height of tooltip

      let top = 0
      let left = 0

      switch (step.position) {
        case "top":
          top = rect.top - tooltipHeight - 10 + window.scrollY
          left = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX
          break
        case "right":
          top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY
          left = rect.right + 10 + window.scrollX
          break
        case "bottom":
          top = rect.bottom + 10 + window.scrollY
          left = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX
          break
        case "left":
          top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY
          left = rect.left - tooltipWidth - 10 + window.scrollX
          break
        case "center":
          top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY
          left = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX
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
      if (rect.top < 0 || rect.left < 0 || rect.bottom > window.innerHeight || rect.right > window.innerWidth) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }
    }

    // Cleanup function
    return () => {
      if (highlightedElement) {
        highlightedElement.classList.remove("tutorial-highlight")
      }
    }
  }, [currentStep, isOpen, steps, highlightedElement, onTabChange])

  // Handle next step
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
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
    if (highlightedElement) {
      highlightedElement.classList.remove("tutorial-highlight")
    }
    setCurrentStep(0)
    onComplete()
  }

  if (!isOpen || !portalContainer) return null

  // Add a global style for the tutorial highlight
  const tutorialStyle = `
    .tutorial-highlight {
      position: relative;
      z-index: 100;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 1000px rgba(0, 0, 0, 0.5);
      border-radius: 4px;
    }
    .tutorial-tooltip {
      z-index: 1000;
      position: absolute;
      width: 320px;
    }
  `

  return createPortal(
    <>
      {/* Add global styles */}
      <style>{tutorialStyle}</style>

      {/* Tooltip */}
      <div
        className="tutorial-tooltip"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        <Card className="p-4 shadow-lg border-blue-200 bg-white">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg">{steps[currentStep]?.title}</h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleComplete}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <p className="text-sm mb-4">{steps[currentStep]?.description}</p>
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {currentStep < steps.length - 1 ? "Next" : "Finish"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>,
    portalContainer,
  )
}
