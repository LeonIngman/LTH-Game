/**
 * Unit Tests for GameHistory Component - Bug #3 Fix
 * Testing null property access bug and proper rendering
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { DailyResult } from '@/types/game'

// Mock the UI components since we're focusing on the logic
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
}))

jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }: any) => <tbody data-testid="table-body">{children}</tbody>,
  TableCell: ({ children, className }: any) => <td className={className} data-testid="table-cell">{children}</td>,
  TableHead: ({ children }: any) => <th data-testid="table-head">{children}</th>,
  TableHeader: ({ children }: any) => <thead data-testid="table-header">{children}</thead>,
  TableRow: ({ children }: any) => <tr data-testid="table-row">{children}</tr>,
}))

// Import the component after mocking dependencies
import { GameHistory } from '@/components/game/ui/game-history'

describe('GameHistory Component - Bug #3 Fix', () => {
  describe('when history is empty', () => {
    it('should display no history message', () => {
      render(<GameHistory history={[]} />)
      
      expect(screen.getByText('No history yet. Complete your first day to see results.')).toBeInTheDocument()
    })
  })

  describe('Bug #3: Null property access handling', () => {
    it('should handle null cash value without crashing', () => {
      const mockHistoryWithNullCash: DailyResult[] = [
        {
          day: 1,
          cash: null as any, // Simulate null cash that causes the bug
          inventory: { patty: 10, bun: 10, cheese: 10, potato: 10, finishedGoods: 0 },
          inventoryValue: { patty: 100, bun: 50, cheese: 80, potato: 40, finishedGoods: 0 },
          holdingCosts: { patty: 2, bun: 1, cheese: 1.6, potato: 0.8, finishedGoods: 0 },
          overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
          pattyPurchased: 10,
          cheesePurchased: 10,
          bunPurchased: 10,
          potatoPurchased: 10,
          production: 5,
          sales: 5,
          revenue: 200.75,
          costs: {
            purchases: 150.25,
            production: 25,
            holding: 5.4,
            total: 180.65
          },
          profit: 20.10,
          cumulativeProfit: 20.10,
          score: 85
        }
      ]

      // This should not throw an error
      expect(() => {
        render(<GameHistory history={mockHistoryWithNullCash} />)
      }).not.toThrow()
      
      // Should show fallback text for null cash
      expect(screen.getByText('N/A')).toBeInTheDocument()
    })

    it('should handle all null values gracefully', () => {
      const mockHistoryWithNullValues: DailyResult[] = [
        {
          day: 1,
          cash: null as any,
          inventory: { patty: 10, bun: 10, cheese: 10, potato: 10, finishedGoods: 0 },
          inventoryValue: { patty: 100, bun: 50, cheese: 80, potato: 40, finishedGoods: 0 },
          holdingCosts: { patty: 2, bun: 1, cheese: 1.6, potato: 0.8, finishedGoods: 0 },
          overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
          pattyPurchased: 10,
          cheesePurchased: 10,
          bunPurchased: 10,
          potatoPurchased: 10,
          production: 5,
          sales: 5,
          revenue: null as any,
          costs: null as any, // This was likely causing the original crash
          profit: null as any,
          cumulativeProfit: null as any,
          score: null as any
        }
      ]

      // This should not throw an error - this was the main issue
      expect(() => {
        render(<GameHistory history={mockHistoryWithNullValues} />)
      }).not.toThrow()
      
      // Should show multiple N/A values for null data
      const naElements = screen.getAllByText('N/A')
      expect(naElements.length).toBeGreaterThanOrEqual(5) // At least 5 N/A values
    })

    it('should handle mixed valid and null values', () => {
      const mockMixedHistory: DailyResult[] = [
        {
          day: 1,
          cash: 1000.50, // Valid
          inventory: { patty: 10, bun: 10, cheese: 10, potato: 10, finishedGoods: 0 },
          inventoryValue: { patty: 100, bun: 50, cheese: 80, potato: 40, finishedGoods: 0 },
          holdingCosts: { patty: 2, bun: 1, cheese: 1.6, potato: 0.8, finishedGoods: 0 },
          overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
          pattyPurchased: 10,
          cheesePurchased: 10,
          bunPurchased: 10,
          potatoPurchased: 10,
          production: 5,
          sales: 5,
          revenue: null as any, // Null
          costs: {
            purchases: 150.25,
            production: 25,
            holding: 5.4,
            total: 180.65 // Valid
          },
          profit: 20.10, // Valid
          cumulativeProfit: null as any, // Null
          score: 85 // Valid
        }
      ]

      expect(() => {
        render(<GameHistory history={mockMixedHistory} />)
      }).not.toThrow()
      
      // Should show valid currency formatted values
      expect(screen.getByText('1000.50 kr')).toBeInTheDocument()
      expect(screen.getByText('180.65 kr')).toBeInTheDocument()
      expect(screen.getByText('20.10 kr')).toBeInTheDocument()
      expect(screen.getByText('85')).toBeInTheDocument()
      
      // Should show N/A for null values
      expect(screen.getAllByText('N/A')).toHaveLength(2) // revenue and cumulativeProfit
    })
  })

  describe('valid data rendering', () => {
    it('should render complete valid history correctly', () => {
      const mockValidHistory: DailyResult[] = [
        {
          day: 1,
          cash: 1000.50,
          inventory: { patty: 10, bun: 10, cheese: 10, potato: 10, finishedGoods: 0 },
          inventoryValue: { patty: 100, bun: 50, cheese: 80, potato: 40, finishedGoods: 0 },
          holdingCosts: { patty: 2, bun: 1, cheese: 1.6, potato: 0.8, finishedGoods: 0 },
          overstockCosts: { patty: 0, bun: 0, cheese: 0, potato: 0, finishedGoods: 0 },
          pattyPurchased: 10,
          cheesePurchased: 10,
          bunPurchased: 10,
          potatoPurchased: 10,
          production: 5,
          sales: 5,
          revenue: 200.75,
          costs: {
            purchases: 150.25,
            production: 25,
            holding: 5.4,
            total: 180.65
          },
          profit: 20.10,
          cumulativeProfit: 20.10,
          score: 85
        }
      ]

      render(<GameHistory history={mockValidHistory} />)
      
      // Verify all values are displayed correctly
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('1000.50 kr')).toBeInTheDocument()
      expect(screen.getByText('200.75 kr')).toBeInTheDocument()
      expect(screen.getByText('180.65 kr')).toBeInTheDocument()
      expect(screen.getByText('20.10 kr')).toBeInTheDocument()
      expect(screen.getByText('85')).toBeInTheDocument()
    })
  })
})
