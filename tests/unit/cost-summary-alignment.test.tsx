/**
 * Simple Test for CostSummary Alignment Issue - UX2
 * Focused test to identify and fix the alignment problem
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { CostSummary } from '@/components/game/ui/cost-summary'
import type { GameState, LevelConfig, GameAction, SupplierOrder } from '@/types/game'

// Mock tooltip components
jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ asChild, children }: { asChild: boolean; children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('CostSummary Alignment - UX2', () => {
  const mockProps = {
    gameState: { cash: 1000 } as GameState,
    levelConfig: { productionCostPerUnit: 2.5 } as LevelConfig,
    action: { production: 5 } as GameAction,
    supplierOrders: [] as SupplierOrder[],
    isLoading: false,
    gameEnded: false,
    onProcessDay: jest.fn(),
    isNextDayButtonDisabled: jest.fn(() => false),
    getNextDayDisabledReason: jest.fn(() => ''),
    calculateTotalPurchaseCost: jest.fn(() => 150.50),
    calculateProductionCost: jest.fn(() => 12.50),
    calculateMaterialPurchaseCost: jest.fn(() => 120.25),
    calculateTransportationCost: jest.fn(() => 30.25),
    calculateHoldingCost: jest.fn(() => 8.15),
    calculateOverstockCost: jest.fn(() => 2.50),
    calculateRevenue: jest.fn(() => 200.75)
  }

  it('should render cost summary component', () => {
    render(<CostSummary {...mockProps} />)
    
    const costSummary = screen.getByTestId('cost-summary')
    expect(costSummary).toBeInTheDocument()
  })

  it('should have properly aligned Total Cost section with top row', () => {
    const { container } = render(<CostSummary {...mockProps} />)
    
    // The problem: bottom section has different grid structure than top
    // Top section: grid-cols-1 md:grid-cols-5 gap-4
    // Bottom section: grid-cols-3 gap-8 (misaligned)
    
    const topGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-5')
    expect(topGrid).toBeInTheDocument()
    
    const bottomSection = container.querySelector('.border-t')
    expect(bottomSection).toBeInTheDocument()
    
    const bottomGrid = bottomSection?.querySelector('.grid.grid-cols-3')
    expect(bottomGrid).toBeInTheDocument()
    
    // This test should initially fail because the alignment is wrong
    // After fix, the bottom should align with the first 3 columns of the top
    expect(bottomGrid).toHaveClass('gap-4') // Should match top gap, not gap-8
  })

  it('should display Total Cost value properly', () => {
    render(<CostSummary {...mockProps} />)
    
    // The Total Cost should be the sum: 120.25 + 12.50 + 8.15 + 2.50 = 143.40
    expect(screen.getByText('143.40 kr')).toBeInTheDocument()
    expect(screen.getByText('Total Cost')).toBeInTheDocument()
  })
})
